# CrowdLift XRPL-Powered SME Fundraising Platform

## Overview

CrowdLift is a modern crowdfunding platform for SMEs, built on the XRP Ledger (XRPL). It enables small and medium enterprises to tokenize their fundraising campaigns, while providing investors with instant liquidity through AMM pools and partial exit capabilities.

## 🏗️ Folder Structure

```
src/
├── components/
│   ├── campaign/
│   │   ├── CampaignCard.tsx
│   │   └── CampaignCreationWizard.tsx
│   ├── trading/
│   │   ├── SwapWidget.tsx
│   │   └── PriceChart.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── kyc/
│   │   └── ai_verifier.js
│   └── ui/           # Reusable UI components (Button, Card, etc.)
├── pages/
│   ├── BrowseCampaigns.tsx
│   ├── CampaignDetail.tsx
│   ├── CampaignOnboard.tsx
│   ├── CreateCampaign.tsx
│   ├── Landing.tsx
│   ├── Portfolio.tsx
│   ├── SupportCampaign.tsx
│   ├── DebugPage.tsx
│   └── TestXRPL.tsx
├── lib/
│   └── xrpl/
│       ├── campaigns.ts
│       ├── client.ts
│       ├── identity.ts
│       ├── tokens.ts
│       ├── trading.ts
│       ├── wallet.ts
│       ├── watchtower.ts
│       ├── milestones.ts
│       ├── sendXRPAndTokens.ts
│       └── utils.ts
├── store/
│   └── useStore.ts
├── types/
│   └── index.ts
├── data/
│   ├── mockdata.json
│   └── mockData.ts
├── hooks/
│   ├── useLivePoolStats.ts
│   └── use-toast.ts
├── css/
│   └── ...
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

## 🔧 XRPL Primitives Used

| Feature | XRPL Transaction | Purpose |
|---------|------------------|---------|
| Identity & Trust | `DidCreate`, `CredentialCreate` | KYC badge + credit-score hash |
| Tokenization | `NFTokenMint` | PIT tokens (semi-fungible) |
| Payments | `Payment` | RLUSD pledges |
| Liquidity & Trading | `AMMCreate`, `AMMDeposit`, `AMMWithdraw` | 24×7 PIT ↔ RLUSD market |
| Watch-Tower | Off-chain cron | Rug-pull protection |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- XRPL Testnet access

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
```bash
# Create .env.local file
VITE_XRPL_SERVER=wss://s.altnet.rippletest.net:51233
VITE_RLUSD_ISSUER=rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De
```



## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```
## Slide Deck

[Slide Deck](https://www.canva.com/design/DAGprr_A9UI/cGRjaD_AzRMizf2riRTxyw/edit)

## 🚀 Demo Video

[![Watch the demo](https://youtu.be/dwSXikncyJw)



## 🖼️ Screenshots

| Launch Campaign | Browse Campaigns | Portfolio |
|----------------|------------------|-----------|
| (<img width="1470" alt="image" src="https://github.com/user-attachments/assets/52aa85ee-c2db-4878-8e50-2368d2878534" />| (<img width="1470" alt="image" src="https://github.com/user-attachments/assets/4718b021-6c3e-4370-9f33-061f41eb88f0" />|(<img width="1470" alt="image" src="https://github.com/user-attachments/assets/20830817-076b-4fc1-9e1a-e363f5bc72be" />|

## 💡 How CrowdLift Works with the XRP Ledger

- **Wallet Integration:** Users connect or import an XRPL wallet (testnet) directly in the browser.
- **Campaign Creation:** When a campaign is launched, a new token is defined and associated with the campaign. The campaign is stored in a shared JSON file, accessible to all clients on the network.
- **Trust Lines:** Investors can create trust lines for campaign tokens using real XRPL transactions.
- **Token Purchase:** Investors send XRP to the campaign issuer, and the issuer sends campaign tokens back, all via XRPL Payment transactions.
- **Portfolio:** Users can view their XRP and token balances, fetched live from the XRPL testnet.
- **All transactions are signed and submitted via xrpl.js, and can be viewed on the XRPL testnet block explorer.**


- Explains the project, code structure, and demonstrates all features live.
- Shows real transactions on the XRPL testnet.
- Explains how the app satisfies all hackathon requirements.

### Code Structure
- **Services**: XRPL integration in `src/lib/xrpl/`
- **Components**: React components in `src/components/`
- **State**: Zustand store in `src/store/`
- **Types**: TypeScript definitions in `src/types/`

## 📞 Support

### Documentation
- **XRPL Docs**: https://xrpl.org/docs
- **API Reference**: `/docs/api`
- **Integration Guide**: `/docs/integration`


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ on XRPL for the future of SME financing**

## 🔗 Block Explorer Link

- [View CrowdLift Transactions on XRPL Testnet](https://testnet.xrpl.org/)
  - _Paste your actual transaction hashes or addresses here for direct links._

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js (Express or similar, for serving and updating campaigns JSON)
- **XRPL:** xrpl.js

## 🏁 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the backend server (serves campaigns JSON and handles POSTs):**
   ```bash
   node api/server.js
   # or your custom server script
   ```
3. **Start the frontend:**
   ```bash
   npm run dev
   ```
4. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)

