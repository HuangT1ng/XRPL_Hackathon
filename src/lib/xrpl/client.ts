import { Client, Wallet, dropsToXrp } from 'xrpl';

export class XRPLClient {
  private client: Client;
  private isConnected: boolean = false;

  constructor(server: string = 'wss://s.altnet.rippletest.net:51233') {
    this.client = new Client(server);
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
      const prepared = await this.client.autofill(transaction);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);
      return result;
    } catch (error) {
      console.error('Error submitting transaction:', error);
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