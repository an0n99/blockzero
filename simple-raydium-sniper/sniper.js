import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";
import fetch from "cross-fetch";
import { Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import dotenv from "dotenv";
import promptSync from 'prompt-sync';

dotenv.config();

const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const priorityFee = parseInt(process.env.PRIORITY_FEE || "50", 10);
const swapAmount = process.env.SWAP_AMOUNT || "1000000";
const slippageBps = parseInt(process.env.SLIPPAGE_BPS || "50", 10);

let connection = new Connection(rpcUrl, "confirmed");

const wallet = new Wallet(
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
);

async function getSwapQuote(inputMint, outputMint, amountSOL) {
  const quoteResponse = await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountSOL}&slippageBps=${slippageBps}`
    )
  ).json();

  return quoteResponse;
}

async function swapTokens(inputMint, outputMint, amountSOL) {
  try {
    const quoteResponse = await getSwapQuote(inputMint, outputMint, amountSOL);
    console.log("Quote Response:", quoteResponse);

    const { swapTransaction } = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          feeAccount: "",  
        }),
      })
    ).json();

    console.log("Swap Transaction:", swapTransaction);

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    transaction.sign([wallet.payer]);

    const latestBlockHash = await connection.getLatestBlockhash();
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {});

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    });

    console.log(`Swap successful: https://solscan.io/tx/${txid}`);

    return txid;
  } catch (error) {
    console.error("Error during token swap:", error);
  }
}

async function main() {
  const prompt = promptSync(); // For command-line input

  // Get the token mint address from the user
  const tokenMintAddress = new PublicKey(prompt("Enter the token address (CA) for the swap: "));

  // Get the amount of SOL to spend for the token swap
  const amount = prompt(`Enter the amount of SOL to spend for the token swap (default: ${swapAmount}): `);
  const amountSOL = amount || swapAmount;

  const inputMint = "So11111111111111111111111111111111111111112"; // SOL mint address
  const tokenMintAddressString = tokenMintAddress.toString();

  const swapTxId = await swapTokens(inputMint, tokenMintAddressString, amountSOL);

  if (swapTxId) {
    console.log("Successfully swapped SOL for the token.");

    console.log("Type 'SELL' to swap the token back to SOL.");

    let userInput = "";
    while (userInput.toUpperCase() !== "SELL") {
      userInput = prompt("Enter 'SELL' to complete the swap: ");
    }

    console.log("Swapping the token back to SOL...");

    await swapTokens(tokenMintAddressString, inputMint, amountSOL);

    console.log("Successfully swapped the token back to SOL.");
  } else {
    console.log("Failed to swap SOL for the token.");
  }
}

main();
