***EXPERIMENTAL***
Needs testing on the testnet

Dependencies: npm install @solana/web3.js bs58 node-fetch commander inquirer

Need to create a package.json: 
{
  "name": "solana-flash-loan",
  "version": "1.0.0",
  "description": "A script to perform flash loans and buy/sell tokens on pump.fun",
  "main": "your_script.js",
  "scripts": {
    "start": "node your_script.js"
  },
  "dependencies": {
    "@solana/web3.js": "^1.30.0",
    "bs58": "^4.0.1",
    "commander": "^9.4.0",
    "node-fetch": "^3.2.10"
  },
  "author": "BlockZero",
  "license": "ISC"
}
