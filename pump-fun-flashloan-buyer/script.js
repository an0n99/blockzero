import { getMarginfiClient } from "./utils";
import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import fetch from 'node-fetch';
import inquirer from 'inquirer';

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed');

async function flashLoanBuy(mint: string, buyerPublicKey: string, amountInSol: number, slippagePercent: number, priorityFee: number, privateKey: string) {
    const response = await fetch(`https://api.pumpdata.fun/buy`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "mint": mint,
            "buyerPublicKey": buyerPublicKey,
            "amountInSol": amountInSol,
            "slippagePercent": slippagePercent,
            "priorityFee": priorityFee,
        })
    });

    if (response.status === 200) {
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        const signerKeyPair = Keypair.fromSecretKey(bs58.decode(privateKey));

        tx.sign([signerKeyPair]);
        const signature = await web3Connection.sendTransaction(tx);

        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText);
    }
}

async function flashLoanSell(mint: string, sellerPublicKey: string, tokens: number, slippagePercent: number, priorityFee: number, privateKey: string) {
    const response = await fetch(`https://api.pumpdata.fun/sell`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "mint": mint,
            "sellerPublicKey": sellerPublicKey,
            "tokens": tokens,
            "slippagePercent": slippagePercent,
            "priorityFee": priorityFee,
        })
    });

    if (response.status === 200) {
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        const signerKeyPair = Keypair.fromSecretKey(bs58.decode(privateKey));

        tx.sign([signerKeyPair]);
        const signature = await web3Connection.sendTransaction(tx);

        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText);
    }
}

async function main() {
    const client = await getMarginfiClient({ readonly: true });

    const marginfiAccounts = await client.getMarginfiAccountsForAuthority();
    if (marginfiAccounts.length === 0) throw Error("No marginfi account found");

    const marginfiAccount = marginfiAccounts[0];

    const solBank = client.getBankByTokenSymbol("SOL");
    if (!solBank) throw Error("SOL bank not found");

    const amount = 10; // SOL

    const borrowIx = await marginfiAccount.makeBorrowIx(amount, solBank.address);
    const repayIx = await marginfiAccount.makeRepayIx(amount, solBank.address, true);

    const flashLoanTx = await marginfiAccount.buildFlashLoanTx({
        ixs: [...borrowIx.instructions, ...repayIx.instructions],
        signers: [],
    });

    await client.processTransaction(flashLoanTx);

    // Interactive command line prompt
    const answers = await inquirer.prompt([
        { type: 'input', name: 'mint', message: 'Enter the token mint address:' },
        { type: 'input', name: 'publicKey', message: 'Enter your public Solana wallet key:' },
        { type: 'password', name: 'privateKey', message: 'Enter your private Solana wallet key:' },
        { type: 'list', name: 'action', message: 'Do you want to buy or sell?', choices: ['Buy', 'Sell'] },
        { type: 'input', name: 'amount', message: 'Enter the amount in SOL for buying (default is 0.1):', when: (answers) => answers.action === 'Buy', default: 0.1 },
        { type: 'input', name: 'tokens', message: 'Enter the amount of tokens for selling:', when: (answers) => answers.action === 'Sell' }
    ]);

    const { mint, publicKey, privateKey, action, amount, tokens } = answers;

    if (action === 'Buy') {
        await flashLoanBuy(mint, publicKey, parseFloat(amount), 25, 0.0001, privateKey);
    } else {
        await flashLoanSell(mint, publicKey, parseFloat(tokens), 25, 0.0001, privateKey);
    }
}

main().catch((e) => console.log(e));
