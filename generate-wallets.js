import { Wallet } from 'xrpl';

console.log('=== XRPL Wallet Configurator ===\n');

// Secrets from user's log and input
const campaignIssuerSecret = 'sEdTguPgkrAfjcx7DFAqfJoGPNgasWw'; 
const rlusdIssuerSecret = 'sEd7jvNQEvPtRTH1XBjrthPXbpqeYeH'; // User provided secret

let campaignIssuerWallet;
let rlusdIssuerWallet;
let areSameAddress = false;

try {
  campaignIssuerWallet = Wallet.fromSecret(campaignIssuerSecret);
  rlusdIssuerWallet = Wallet.fromSecret(rlusdIssuerSecret);
  areSameAddress = campaignIssuerWallet.classicAddress === rlusdIssuerWallet.classicAddress;
  
  console.log('Validating provided secrets...');
  console.log(`VITE_ISSUER_SECRET -> ${campaignIssuerWallet.classicAddress}`);
  console.log(`VITE_RLUSD_ISSUER_SECRET -> ${rlusdIssuerWallet.classicAddress}`);
  console.log(`Are they the same address? -> ${areSameAddress}\n`);

} catch (error) {
  console.error('Error: Could not decode one of the secrets. Please ensure they are valid.', error.message);
  // Exit if secrets are invalid, as we can't proceed.
  process.exit(1); 
}

if (!areSameAddress) {
    console.log('✅ Success! The two secrets point to different wallets, which is correct.\n');
    console.log('=== ACTION REQUIRED ===\n');
    console.log('Please create a file named `.env` in the root of your project and paste the following content:\n');
    console.log('--------------------------------------------------');
    console.log(`# Campaign Token Issuer Wallet`);
    console.log(`VITE_ISSUER_SECRET=${campaignIssuerSecret}`);
    console.log(`# Address: ${campaignIssuerWallet.classicAddress}\n`);

    console.log(`# RLUSD Stablecoin Issuer Wallet`);
    console.log(`VITE_RLUSD_ISSUER_SECRET=${rlusdIssuerSecret}`);
    console.log(`# Address: ${rlusdIssuerWallet.classicAddress}`);
    console.log('--------------------------------------------------\n');

    console.log('=== NEXT STEPS ===');
    console.log('1. **IMPORTANT**: Both of these wallets need to be funded with test XRP to be activated.');
    console.log('2. Go to the XRPL Testnet Faucet: https://xrpl.org/xrp-testnet-faucet.html');
    console.log(`3. Fund the Campaign Issuer Address: ${campaignIssuerWallet.classicAddress}`);
    console.log(`4. Fund the RLUSD Issuer Address: ${rlusdIssuerWallet.classicAddress}`);
    console.log('5. After both wallets are funded, restart your development server (`npm run dev`) and try creating a campaign again.');

} else {
    console.log('❌ Error: The provided secrets still result in the same wallet address.');
    console.log('The Campaign Issuer and RLUSD Issuer *must* be different wallets.');
    console.log('Please provide a different secret for the RLUSD issuer, or allow me to generate a new one for you.');
} 