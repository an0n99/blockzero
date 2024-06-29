import { Connection, Keypair, VersionedTransaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from "bs58";
import fetch from 'node-fetch';
import inquirer from 'inquirer';

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed');

async function flashLoanBuy(mint, buyerPublicKey, amountInSol, slippagePercent, priorityFee, privateKey) {
    // Send a request to the pumpdata.fun API to get the buy transaction
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
        // Deserialize the transaction data
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        const signerKeyPair = Keypair.fromSecretKey(bs58.decode(privateKey));

        // Sign the transaction with your private key
        tx.sign([signerKeyPair]);

        // Send the signed transaction to the Solana network
        const signature = await web3Connection.sendTransaction(tx);

        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText);
    }
}

async function flashLoanSell(mint, sellerPublicKey, tokens, slippagePercent, priorityFee, privateKey) {
    // Send a request to the pumpdata.fun API to get the sell transaction
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
        // Deserialize the transaction data
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        const signerKeyPair = Keypair.fromSecretKey(bs58.decode(privateKey));

        // Sign the transaction with your private key
        tx.sign([signerKeyPair]);

        // Send the signed transaction to the Solana network
        const signature = await web3Connection.sendTransaction(tx);

        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText);
    }
}

async function main() {
    // Interactive command line prompt to get user inputs
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
