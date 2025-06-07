import * as xrpl from 'xrpl';
import dotenv from 'dotenv';
dotenv.config();

// --- Configuration ---
const BUYER_SECRET = process.env.VITE_BUYER_SECRET;
const RLUSD_ISSUER_SECRET = process.env.VITE_RLUSD_ISSUER_SECRET;
const RLUSD_AMOUNT_TO_SEND = '100000'; // The amount of "cash" to send to the buyer
const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

// --- Main script ---

async function setupAndFundBuyer() {
  console.log('--- Starting Demo Buyer Setup Script ---');

  // Validate that secrets are loaded
  if (!BUYER_SECRET || !RLUSD_ISSUER_SECRET) {
    console.error('Error: Both VITE_BUYER_SECRET and VITE_RLUSD_ISSUER_SECRET must be set in your .env file.');
    return;
  }

  // Define the client and connect
  const client = new xrpl.Client(TESTNET_URL);
  try {
    console.log('Connecting to XRPL Testnet...');
    await client.connect();

    // Create wallet objects from secrets
    const buyerWallet = xrpl.Wallet.fromSeed(BUYER_SECRET);
    const issuerWallet = xrpl.Wallet.fromSeed(RLUSD_ISSUER_SECRET);
    
    console.log(`> Buyer Account: ${buyerWallet.classicAddress}`);
    console.log(`> RLUSD Issuer Account: ${issuerWallet.classicAddress}`);

    // Define the RLUSD currency in the required hex format
    const rlusdHex = xrpl.convertStringToHex('RLUSD').padEnd(40, '0');

    // --- Step 1: Set Trust Line from Buyer to Issuer ---
    console.log('\n--- Step 1: Preparing Trust Line for RLUSD ---');
    
    const trustSetTx = {
      TransactionType: 'TrustSet',
      Account: buyerWallet.classicAddress,
      LimitAmount: {
        issuer: issuerWallet.classicAddress,
        currency: rlusdHex,
        value: '100000', // Set a high limit
      },
    };

    console.log('Submitting TrustSet transaction...');
    const trustSetResult = await client.submitAndWait(trustSetTx, { wallet: buyerWallet });

    if (trustSetResult.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log('✅ Trust Line was set successfully!');
    } else {
      // It's okay if it fails with tecDUPLICATE, means it's already set.
      if (trustSetResult.result.meta.TransactionResult === 'tecDUPLICATE') {
        console.log('✅ Trust Line already exists, no action needed.');
      } else {
        throw new Error(`Error setting Trust Line: ${trustSetResult.result.meta.TransactionResult}`);
      }
    }
    
    // --- Step 2: Send RLUSD from Issuer to Buyer ---
    console.log('\n--- Step 2: Preparing to send RLUSD "cash" to buyer ---');

    const paymentTx = {
      TransactionType: 'Payment',
      Account: issuerWallet.classicAddress,
      Destination: buyerWallet.classicAddress,
      Amount: {
        issuer: issuerWallet.classicAddress,
        currency: rlusdHex,
        value: RLUSD_AMOUNT_TO_SEND,
      },
    };

    console.log(`Sending ${RLUSD_AMOUNT_TO_SEND} RLUSD...`);
    const paymentResult = await client.submitAndWait(paymentTx, { wallet: issuerWallet });
    
    if (paymentResult.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log(`✅ Successfully sent ${RLUSD_AMOUNT_TO_SEND} RLUSD to the buyer!`);
    } else {
      throw new Error(`Error sending payment: ${paymentResult.result.meta.TransactionResult}`);
    }

  } catch (error) {
    console.error('\n❌ An error occurred:');
    console.error(error);
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
    console.log('\n--- Script finished ---');
  }
}

setupAndFundBuyer(); 