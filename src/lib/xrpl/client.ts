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
      console.log(`Initializing XRPL client with server: ${serverUrl}`);
    }
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to XRPL');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Disconnected from XRPL');
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
      console.error('Error getting account info:', error);
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
      
      const prepared = await this.client.autofill(transaction);
      
      log.debug('XRPL_CLIENT', 'Transaction autofilled', {
        lastLedgerSequence: prepared.LastLedgerSequence,
        fee: prepared.Fee,
        sequence: prepared.Sequence
      });
      
      const signed = wallet.sign(prepared);
      
      log.info('XRPL_CLIENT', 'Submitting transaction to XRPL...');
      const result = await this.client.submitAndWait(signed.tx_blob);
      
      log.info('XRPL_CLIENT', 'Transaction successful', { 
        hash: result.result.hash,
        validated: result.result.validated 
      });
      
      return result;
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