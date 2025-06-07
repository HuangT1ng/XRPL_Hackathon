import { Client, Wallet, dropsToXrp } from 'xrpl';
import { config } from '../config';
import { log } from '../logger';

export class XRPLClient {
  private client: Client;
  private isConnected: boolean = false;

  constructor(server?: string) {
    const serverUrl = server || config.xrpl.server;
    this.client = new Client(serverUrl);
    
    if (config.dev.enableLogging) {
      log.info('XRPL_CLIENT', `Initializing XRPL client with server: ${serverUrl}`);
    }
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      log.info('XRPL_CLIENT', 'Connected to XRPL');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      log.info('XRPL_CLIENT', 'Disconnected from XRPL');
    }
  }

  getClient(): Client {
    return this.client;
  }

  async getAccountInfo(address: string) {
    await this.connect();
    try {
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      return response.result;
    } catch (error) {
      log.error('XRPL_CLIENT', 'Error getting account info', { address, error });
      throw error;
    }
  }

  async getAccountBalance(address: string): Promise<string> {
    const accountInfo = await this.getAccountInfo(address);
    return dropsToXrp(accountInfo.account_data.Balance.toString());
  }

  async submitTransaction(transaction: any, wallet: Wallet) {
    await this.connect();
    
    try {
      log.debug('XRPL_CLIENT', 'Preparing transaction', { 
        transactionType: transaction.TransactionType,
        account: transaction.Account 
      });
      
      // Get current ledger info first
      const ledgerResponse = await this.client.request({
        command: 'ledger',
        ledger_index: 'validated'
      });
      const currentLedger = ledgerResponse.result.ledger_index;
      
      // Autofill the transaction
      const prepared = await this.client.autofill(transaction);
      
      // Override LastLedgerSequence with a safer value
      const saferLastLedger = currentLedger + (config.app.ledgerOffset || 20);
      prepared.LastLedgerSequence = saferLastLedger;
      
      log.debug('XRPL_CLIENT', 'Transaction prepared with safer LastLedgerSequence', {
        currentLedger,
        originalLastLedger: prepared.LastLedgerSequence,
        saferLastLedger,
        fee: prepared.Fee,
        sequence: prepared.Sequence
      });
      
      const signed = wallet.sign(prepared);
      
      log.info('XRPL_CLIENT', 'Submitting transaction to XRPL...');
      
      // Use submit() with timeout instead of submitAndWait()
      const submitResult = await this.client.submit(signed.tx_blob);
      
      if (!submitResult.result || submitResult.result.engine_result !== 'tesSUCCESS') {
        throw new Error(`Transaction submission failed: ${submitResult.result?.engine_result || 'Unknown error'}`);
      }
      
      const txHash = submitResult.result.tx_json.hash;
      log.info('XRPL_CLIENT', 'Transaction submitted successfully, waiting for validation...', { hash: txHash });
      
      // Wait for validation with timeout
      const result = await this.waitForValidation(txHash, 60000); // 60 second timeout
      
      log.info('XRPL_CLIENT', 'Transaction validated successfully', { 
        hash: txHash,
        validated: true 
      });
      
      return { result: { hash: txHash, validated: true, ...result } };
    } catch (error: any) {
      log.error('XRPL_CLIENT', 'Transaction failed', {
        error: error.message,
        code: error.code,
        type: error.type
      });
      throw error;
    }
  }

  async waitForValidation(txHash: string, timeout: number = 30000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.client.request({
          command: 'tx',
          transaction: txHash
        });
        
        if (response.result.validated) {
          return response.result;
        }
      } catch {
        // Transaction not found yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Transaction ${txHash} not validated within timeout`);
  }
}

// Singleton instance
export const xrplClient = new XRPLClient(); 