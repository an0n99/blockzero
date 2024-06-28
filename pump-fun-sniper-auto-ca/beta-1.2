const express = require('express');
const bodyParser = require('body-parser');
const {
    Connection,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');
const fetch = require('node-fetch');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

const GLOBAL = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOC_TOKEN_ACC_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const RENT = new PublicKey("SysvarRent111111111111111111111111111111111");
const SYSTEM_PROGRAM_ID = SystemProgram.programId;

const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE';
const BUY_AMOUNT_SOL = 0.0001; // Adjust SOL amount as needed
const PROFIT_PERCENTAGE = 20; // 20% profit
const CUSTOM_RPC_URL = 'YOUR_RPC_URL_HERE';

const STATE_FILE = path.join(__dirname, 'purchasedCoins.json');
const savePurchasedCoins = (coins) => {
    fs.writeFileSync(STATE_FILE, JSON.stringify(coins, null, 2), 'utf-8');
};

const loadPurchasedCoins = () => {
    if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    }
    return [];
};

let purchasedCoins = loadPurchasedCoins();

const getKeyPairFromPrivateKey = (key) => Keypair.fromSecretKey(new Uint8Array(bs58.decode(key)));

const bufferFromUInt64 = (value) => {
    let buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(value));
    return buffer;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch coin data from Raydium API
const getCoinDataByAddress = async (address) => {
    const response = await fetch(`https://api.raydium.io/v2/main/market?ids=${address}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data[address];
};

const createTransaction = async (connection, instructions, payer, priorityFeeInSol = 0) => {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 });
    const transaction = new Transaction().add(modifyComputeUnits);
    if (priorityFeeInSol > 0) {
        const microLamports = priorityFeeInSol * 1_000_000_000;
        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports });
        transaction.add(addPriorityFee);
    }
    transaction.add(...instructions);
    transaction.feePayer = payer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    return transaction;
};

const sendAndConfirmTransactionWrapper = async (connection, transaction, signers, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
                skipPreflight: true,
                preflightCommitment: 'confirmed',
                commitment: 'confirmed'
            });
            console.log('Transaction confirmed with signature:', signature);
            return signature;
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt === maxRetries - 1) throw error;
            await sleep(2000);
            transaction.recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        }
    }
};

const buyCoin = async (connection, payer, coinData, solIn, priorityFeeInSol = 0.001, slippageDecimal = 0.25) => {
    try {
        const owner = payer.publicKey;
        const mintPubkey = new PublicKey(coinData.mint);

        const tokenAccountAddress = await getAssociatedTokenAddress(mintPubkey, owner, false);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

        const instructions = [];
        if (!tokenAccountInfo) {
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    payer.publicKey,
                    tokenAccountAddress,
                    payer.publicKey,
                    mintPubkey
                )
            );
        }

        const solInLamports = solIn * LAMPORTS_PER_SOL;
        const tokenOut = Math.floor(solInLamports * coinData.virtual_token_reserves / coinData.virtual_sol_reserves);
        const solInWithSlippage = solIn * (1 + slippageDecimal);
        const maxSolCost = Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mintPubkey, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData.bonding_curve), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData.associated_bonding_curve), isSigner: false, isWritable: true },
            { pubkey: tokenAccountAddress, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false }
        ];

        const data = Buffer.concat([
            Buffer.from([0]),
            bufferFromUInt64(solInLamports),
            bufferFromUInt64(maxSolCost),
            bufferFromUInt64(tokenOut)
        ]);

        instructions.push(new TransactionInstruction({
            keys,
            programId: PUMP_FUN_PROGRAM,
            data
        }));

        const transaction = await createTransaction(connection, instructions, payer, priorityFeeInSol);
        const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);

        purchasedCoins.push({
            name: coinData.name,
            symbol: coinData.symbol,
            mint: coinData.mint,
            purchasePrice: solIn,
            purchaseTime: new Date().toISOString(),
            currentPrice: solIn,
            signature
        });

        savePurchasedCoins(purchasedCoins);
        console.log('Coin purchased successfully:', coinData.name);
    } catch (error) {
        console.error('Error during coin purchase:', error);
    }
};

const sellCoin = async (connection, payer, coinData, solOut, priorityFeeInSol = 0.001) => {
    try {
        const owner = payer.publicKey;
        const mintPubkey = new PublicKey(coinData.mint);

        const tokenAccountAddress = await getAssociatedTokenAddress(mintPubkey, owner, false);

        const instructions = [];
        const solOutLamports = solOut * LAMPORTS_PER_SOL;

        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mintPubkey, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData.bonding_curve), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData.associated_bonding_curve), isSigner: false, isWritable: true },
            { pubkey: tokenAccountAddress, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false }
        ];

        const data = Buffer.concat([
            Buffer.from([1]), // Instruction index for selling
            bufferFromUInt64(solOutLamports)
        ]);

        instructions.push(new TransactionInstruction({
            keys,
            programId: PUMP_FUN_PROGRAM,
            data
        }));

        const transaction = await createTransaction(connection, instructions, payer, priorityFeeInSol);
        const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);

        console.log('Coin sold successfully:', coinData.name);
    } catch (error) {
        console.error('Error during coin sale:', error);
    }
};

const monitorPrices = async (connection, payer) => {
    while (true) {
        for (const coin of purchasedCoins) {
            try {
                const coinData = await getCoinDataByAddress(coin.mint);
                const currentPrice = (coinData.virtual_sol_reserves / coinData.virtual_token_reserves) * LAMPORTS_PER_SOL;

                if (currentPrice >= coin.purchasePrice * (1 + PROFIT_PERCENTAGE / 100)) {
                    await sellCoin(connection, payer, coin, BUY_AMOUNT_SOL);
                    purchasedCoins = purchasedCoins.filter(c => c.mint !== coin.mint);
                    savePurchasedCoins(purchasedCoins);
                } else {
                    coin.currentPrice = currentPrice;
                }
            } catch (error) {
                console.error('Error checking price for coin:', coin.name, error);
            }
        }
        await sleep(2000); // Check every 2 seconds
    }
};

const startServer = (connection, payer) => {
    const app = express();
    app.use(bodyParser.json());

    app.post('/buy', async (req, res) => {
        const { contractAddress } = req.body;
        if (!contractAddress) {
            return res.status(400).send('Contract address is required');
        }

        try {
            const coinData = await getCoinDataByAddress(contractAddress);
            if (!coinData) {
                return res.status(404).send('Coin data not found');
            }

            await buyCoin(connection, payer, coinData, BUY_AMOUNT_SOL);
            res.send('Coin purchase initiated');
        } catch (error) {
            console.error('Error buying coin:', error);
            res.status(500).send('Internal server error');
        }
    });

    app.get('/positions', (req, res) => {
        res.json(purchasedCoins);
    });

    app.listen(3000, () => {
        console.log('Sniper Bot server listening on port 3000');
    });
};

const main = async () => {
    const connection = new Connection(CUSTOM_RPC_URL, 'confirmed');
    const payer = getKeyPairFromPrivateKey(PRIVATE_KEY);

    startServer(connection, payer);
    monitorPrices(connection, payer);
};

main().catch((error) => {
    console.error('Error in main execution:', error);
});
