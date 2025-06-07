import { Wallet } from 'xrpl';
import { xrplClient } from './client';
import { config } from '../config';
import { log } from '../logger';

export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  wallet: Wallet;
}

export class XRPLWalletService {
  
  /**
   * Create a new XRPL wallet and fund it on testnet
   */
  async createAndFundWallet(): Promise<WalletInfo> {
    try {
      if (config.dev.enableLogging) {
        log.info('XRPL_WALLET', 'Creating new XRPL wallet...');
      }

      // Generate new wallet
      const wallet = Wallet.generate();
      
      if (config.dev.enableLogging) {
        log.info('XRPL_WALLET', `Generated wallet: ${wallet.classicAddress}`);
      }

      // Fund wallet on testnet
      if (config.xrpl.network === 'testnet') {
        await this.fundTestnetWallet(wallet.classicAddress);
      }

      // Get actual balance
      const balance = await this.getWalletBalance(wallet.classicAddress);

      return {
        address: wallet.classicAddress,
        balance,
        network: config.xrpl.network,
        wallet
      };
    } catch (error) {
      log.error('XRPL_WALLET', 'Failed to create and fund wallet', { error });
      throw new Error(`Wallet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fund a wallet on XRPL testnet using the faucet
   */
  async fundTestnetWallet(address: string): Promise<void> {
    try {
      if (config.dev.enableLogging) {
        log.info('XRPL_WALLET', `Funding testnet wallet: ${address}`);
      }

      const response = await fetch(config.xrpl.faucetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (config.dev.enableLogging) {
        log.info('XRPL_WALLET', 'Faucet response', { result });
      }

      // Wait for funding to be processed
      await this.waitForFunding(address);
      
    } catch (error) {
      log.error('XRPL_WALLET', 'Failed to fund testnet wallet', { address, error });
      throw error;
    }
  }

  /**
   * Wait for wallet to be funded and activated
   */
  private async waitForFunding(address: string, maxAttempts: number = 10): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const balance = await this.getWalletBalance(address);
        if (parseFloat(balance) > 0) {
          if (config.dev.enableLogging) {
            log.info('XRPL_WALLET', `Wallet funded successfully. Balance: ${balance} XRP`);
          }
          return;
        }
      } catch (error) {
        // Account might not exist yet, continue waiting
      }

      if (config.dev.enableLogging) {
        log.info('XRPL_WALLET', `Waiting for funding... Attempt ${attempt}/${maxAttempts}`);
      }
      
      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Wallet funding timeout - please try again');
  }

  /**
   * Get the actual balance of a wallet from XRPL
   */
  async getWalletBalance(address: string): Promise<string> {
    try {
      return await xrplClient.getAccountBalance(address);
    } catch (error) {
      if (config.dev.enableLogging) {
        log.warn('XRPL_WALLET', `Account ${address} not found or not activated yet`);
      }
      return '0';
    }
  }

  /**
   * Validate if an address is a valid XRPL address
   */
  isValidAddress(address: string): boolean {
    try {
      // Basic XRPL address validation
      return address.length >= 25 && address.length <= 34 && address.startsWith('r');
    } catch {
      return false;
    }
  }

  /**
   * Import wallet from seed/secret (for development/testing)
   */
  importWallet(seed: string): WalletInfo {
    try {
      const wallet = Wallet.fromSeed(seed);
      
      return {
        address: wallet.classicAddress,
        balance: '0', // Will be fetched separately
        network: config.xrpl.network,
        wallet
      };
    } catch (error) {
      throw new Error(`Invalid wallet seed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const xrplWalletService = new XRPLWalletService(); 