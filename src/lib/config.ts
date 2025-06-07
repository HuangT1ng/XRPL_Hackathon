// Configuration for XRPL and external services
export const config = {
  // XRPL Network Configuration
  xrpl: {
    server: import.meta.env.VITE_XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233',
    network: import.meta.env.VITE_XRPL_NETWORK || 'testnet',
    faucetUrl: import.meta.env.VITE_XRPL_FAUCET || 'https://faucet.altnet.rippletest.net/accounts',
  },
  
  // External API Configuration
  apis: {
    xero: {
      baseUrl: import.meta.env.VITE_XERO_API_URL || 'https://api.xero.com',
      clientId: import.meta.env.VITE_XERO_CLIENT_ID || '',
      scope: 'accounting.reports.read',
    },
    payNow: {
      baseUrl: import.meta.env.VITE_PAYNOW_API_URL || 'https://api.paynow.gov.sg',
      apiKey: import.meta.env.VITE_PAYNOW_API_KEY || '',
    },
    ipfs: {
      gateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs',
      apiUrl: import.meta.env.VITE_IPFS_API_URL || 'https://ipfs.infura.io:5001',
      projectId: import.meta.env.VITE_IPFS_PROJECT_ID || '',
      projectSecret: import.meta.env.VITE_IPFS_PROJECT_SECRET || '',
    },
  },
  
  // Application Configuration
  app: {
    defaultTokenDecimals: 6,
    defaultSlippage: 0.5, // 0.5%
    transactionTimeout: 30000, // 30 seconds
    priceUpdateInterval: 5000, // 5 seconds
    portfolioRefreshInterval: 10000, // 10 seconds
    ledgerOffset: parseInt(import.meta.env.VITE_LEDGER_OFFSET || '20'), // Add ledgers to LastLedgerSequence for safety
  },
  
  // Safety Fund Configuration
  safetyFund: {
    feePercentage: 10, // 10% of trading fees
    minimumThreshold: 1000, // Minimum balance in RLUSD
    emergencyContactAddress: import.meta.env.VITE_EMERGENCY_CONTACT || '',
  },
  
  // Secrets from .env
  secrets: {
    issuerSecret: import.meta.env.VITE_ISSUER_SECRET || '',
    fundingSecret: import.meta.env.VITE_FUNDING_SECRET || '',
  },
  
  // Development flags
  dev: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
    skipRealTransactions: import.meta.env.VITE_SKIP_REAL_TX === 'true',
  }
};

// Debug: Log configuration and environment variables
console.log('🔧 Configuration loaded:', {
  network: config.xrpl.network,
  useMockData: config.dev.useMockData,
  skipRealTransactions: config.dev.skipRealTransactions,
  enableLogging: config.dev.enableLogging
});

console.log('🔍 Environment variables debug:', {
  VITE_XRPL_NETWORK: import.meta.env.VITE_XRPL_NETWORK,
  VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
  VITE_SKIP_REAL_TX: import.meta.env.VITE_SKIP_REAL_TX,
  VITE_ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

export default config; 