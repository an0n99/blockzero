const express = require('express');
const bodyParser = require('body-parser');
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

const rpcUrl = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const priorityFee = parseInt(process.env.PRIORITY_FEE || "50", 10);
const swapAmount = process.env.SWAP_AMOUNT || "1000000";
const slippageBps = parseInt(process.env.SLIPPAGE_BPS || "50", 10);

let connection = new Connection(rpcUrl, "confirmed");

const wallet = new Wallet(
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
);

app.use(bodyParser.json());

app.post('/api/buy', async (req, res) => {
    const contractAddress = req.body.contractAddress;

    if (contractAddress) {
        console.log(`Received contract address: ${contractAddress}`);

        try {
            // Perform token purchase
            const txid = await swapTokens("So11111111111111111111111111111111111111112", contractAddress, swapAmount);

            if (txid) {
                res.status(200).send(`Purchase initiated successfully: https://solscan.io/tx/${txid}`);
            } else {
                res.status(500).send('Failed to swap SOL for the token.');
            }
        } catch (error) {
            console.error('Error initiating purchase:', error);
            res.status(500).send('Error initiating purchase');
        }
    } else {
        res.status(400).send('No contract address provided');
    }
});

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
        return null;
    }
}

app.listen(port, () => {
    console.log(`JS bot server listening at http://localhost:${port}`);
});
