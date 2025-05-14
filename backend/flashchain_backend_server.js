require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const bs58 = require("bs58");
const {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl
} = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  transfer
} = require("@solana/spl-token");

// CONFIGURATION
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
const FCAI_TOKEN_MINT = new PublicKey("YOUR_FCAI_TOKEN_MINT_ADDRESS"); // Replace with your SPL token mint
const SOL_RECEIVE_ADDRESS = new PublicKey("YOUR_SOL_RECEIVE_ADDRESS"); // Replace with wallet receiving SOL

const app = express();
app.use(bodyParser.json());

// POST: Verify payment and send tokens
app.post("/verify-and-send", async (req, res) => {
  try {
    const { userAddress, txSignature } = req.body;
    const userWallet = new PublicKey(userAddress);

    // Get transaction details
    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx || !tx.meta || !tx.transaction) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    const paid = tx.transaction.message.accountKeys.some(
      (acc) => acc.pubkey.equals(SOL_RECEIVE_ADDRESS)
    );

    if (!paid) {
      return res.status(400).json({ error: "Payment to wrong address" });
    }

    // Prepare token accounts
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      FCAI_TOKEN_MINT,
      wallet.publicKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      FCAI_TOKEN_MINT,
      userWallet
    );

    // Transfer FCAI tokens (e.g., 2000)
    const signature = await transfer(
      connection,
      wallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      wallet.publicKey,
      2000 // amount of tokens (adjust based on decimals)
    );

    console.log("✅ Sent FCAI to", userWallet.toBase58(), "TX:", signature);
    res.json({ success: true, tokenTx: signature });
  } catch (e) {
    console.error("❌ Error:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Flashchain AI backend running on port ${PORT}`);
});
