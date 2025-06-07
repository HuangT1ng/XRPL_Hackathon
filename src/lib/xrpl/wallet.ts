import { Wallet } from 'xrpl';
import { xrplClient } from './client';
import { config } from '../config';

export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  wallet: Wallet;
}

export class XRPLWalletService {
  private readonly STORAGE_KEY = 'xrpl_wallet_seed';
  
  /**
   * Save wallet seed to localStorage
   */
  private saveWalletSeed(seed: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, seed);
    } catch (error) {
      console.error('Failed to save wallet seed:', error);
    }
  }

  /**
   * Load wallet seed from localStorage
   */
  private loadWalletSeed(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to load wallet seed:', error);
      return null;
    }
  }

  /**
   * Get existing wallet or create new one
   */
  async getOrCreateWallet(): Promise<WalletInfo> {
    try {
      // Try to load existing wallet
      const existingSeed = this.loadWalletSeed();
      if (existingSeed) {
        if (config.dev.enableLogging) {
          console.log('Loading existing wallet...');
        }
        return this.importWallet(existingSeed);
      }

      // Create new wallet if none exists
      if (config.dev.enableLogging) {
        console.log('No existing wallet found, creating new one...');
      }
      const walletInfo = await this.createAndFundWallet();
      
      // Save the new wallet seed
      if (walletInfo.wallet.seed) {
        this.saveWalletSeed(walletInfo.wallet.seed);
      }
      
      return walletInfo;
    } catch (error) {
      console.error('Failed to get or create wallet:', error);
      throw new Error(`Wallet operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new XRPL wallet and fund it on testnet
   */
  async createAndFundWallet(): Promise<WalletInfo> {
    try {
      if (config.dev.enableLogging) {
        console.log('Creating new XRPL wallet...');
      }

      // Generate new wallet
      const wallet = Wallet.generate();
      
      if (config.dev.enableLogging) {
        console.log(`Generated wallet: ${wallet.classicAddress}`);
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
      console.error('Failed to create and fund wallet:', error);
      throw new Error(`Wallet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fund a wallet on XRPL testnet using the faucet
   */
  async fundTestnetWallet(address: string): Promise<void> {
    try {
      if (config.dev.enableLogging) {
        console.log(`Funding testnet wallet: ${address}`);
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
        console.log('Faucet response:', result);
      }

      // Wait for funding to be processed
      await this.waitForFunding(address);
      
    } catch (error) {
      console.error('Failed to fund testnet wallet:', error);
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
            console.log(`Wallet funded successfully. Balance: ${balance} XRP`);
          }
          return;
        }
      } catch (error) {
        // Account might not exist yet, continue waiting
      }

      if (config.dev.enableLogging) {
        console.log(`Waiting for funding... Attempt ${attempt}/${maxAttempts}`);
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
        console.log(`Account ${address} not found or not activated yet`);
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