import type { Payment } from 'xrpl';

const XRPL_WS = 'wss://testnet.xrpl-labs.com';

export function toCurrencyHex(code: string): string {
  return Buffer.from(code, 'ascii').toString('hex').toUpperCase().padEnd(40, '0');
}

export async function sendXRPAndTokens(
  buyerWallet: any,
  issuerSecret: string,
  issuerAddress: string,
  buyerAddress: string,
  tokenSymbol: string,
  tokenAmount: string = '1000'
) {
  console.log('sendXRPAndTokens called', { buyerWallet, issuerAddress, buyerAddress, tokenSymbol });
  try {
    const xrpl = await import('xrpl');
    // 1. Send 1 XRP from buyer to issuer
    const client = new xrpl.Client(XRPL_WS);
    await client.connect();

    const xrpPayment: Payment = {
      TransactionType: 'Payment',
      Account: buyerWallet.classicAddress,
      Destination: issuerAddress,
      Amount: xrpl.xrpToDrops(1),
    };
    const preparedXRP = await client.autofill(xrpPayment);
    const signedXRP = buyerWallet.sign(preparedXRP);
    console.log('Signed XRP tx_blob:', signedXRP.tx_blob);

    // Always use hex for custom tokens (length > 3)
    const tokenCurrency = tokenSymbol.length === 3 ? tokenSymbol : toCurrencyHex(tokenSymbol);

    const issuerWallet = xrpl.Wallet.fromSeed(issuerSecret);
    const tokenPayment: Payment = {
      TransactionType: 'Payment',
      Account: issuerWallet.classicAddress,
      Destination: buyerAddress,
      Amount: {
        currency: tokenCurrency,
        value: tokenAmount,
        issuer: issuerWallet.classicAddress,
      },
    };
    const preparedToken = await client.autofill(tokenPayment);
    const signedToken = issuerWallet.sign(preparedToken);
    console.log('Signed Token tx_blob:', signedToken.tx_blob);

    await client.disconnect();

    // 3. Submit both tx_blobs via WebSocket
    const ws = new window.WebSocket(XRPL_WS);

    ws.onopen = () => {
      console.log('WebSocket opened');
      ws.send(JSON.stringify({
        id: 1,
        command: 'submit',
        tx_blob: signedXRP.tx_blob,
      }));
      ws.send(JSON.stringify({
        id: 2,
        command: 'submit',
        tx_blob: signedToken.tx_blob,
      }));
      console.log('Submitted both tx_blobs via WebSocket');
    };

    ws.onmessage = (msg) => {
      console.log('WebSocket message:', msg.data);
      const data = JSON.parse(msg.data);
      if (data.id === 1) {
        console.log('1 XRP payment result:', data);
      }
      if (data.id === 2) {
        console.log('Token payment result:', data);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = (e) => {
      console.log('WebSocket closed', e);
    };
  } catch (err) {
    console.error('Error in sendXRPAndTokens:', err);
  }
} 