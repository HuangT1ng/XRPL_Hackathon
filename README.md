# CrowdLift v2 - XRPL-Powered SME Fundraising Platform

## Overview

CrowdLift v2 is a modern crowdfunding platform for SMEs, built on the XRP Ledger (XRPL). It enables small and medium enterprises to tokenize their fundraising campaigns, while providing investors with instant liquidity through AMM pools and partial exit capabilities.

## 🚀 Key Features

### For SMEs
- **Instant Campaign Creation**: Launch tokenized fundraising campaigns in minutes
- **DID-Based Identity**: Verifiable identity with credit score integration
- **Real-Time Credit Scoring**: Integration with Xero/PayNow APIs for dynamic credit assessment

### For Investors
- **Liquid PIT Tokens**: Trade pre-IPO tokens 24/7 on XRPL AMMs
- **Partial Exit Slider**: Sell 10/25/50% of holdings instantly
- **Safety Net Protection**: Community-funded insurance against defaults

### For the Ecosystem
- **Watch-Tower Bot**: Automated monitoring and refund protection
- **AMM Liquidity Pools**: Earn fees while providing liquidity
- **Safety Fund**: 10% of trading fees fund community protection
- **Real-Time Transparency**: All activities tracked on XRPL

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

## 🔄 User Flow

### SME Onboarding
1. **Connect Wallet**: Generate XRPL wallet or connect existing
2. **KYC Submission**: Upload company documents
3. **DID Creation**: Automated DID creation with credit score hash
4. **Campaign Setup**: Use wizard to configure campaign parameters

### Campaign Launch
1. **Token Minting**: Mint PIT tokens using `NFTokenMint`
2. **AMM Creation**: Create PIT/RLUSD pool with `AMMCreate`
3. **Go Live**: Campaign becomes available for investment

### Investment & Trading
1. **Token Purchase**: Swap RLUSD for PIT tokens via AMM
2. **Partial Exits**: Use slider to sell 10/25/50% instantly
3. **Liquidity Provision**: Add liquidity to earn trading fees
4. **Portfolio Tracking**: Real-time portfolio updates

## 🔒 Safety Mechanisms

### Watch-Tower Bot
- **Dormancy Detection**: Monitors SME wallet activity
- **Auto-Refund**: Triggers refund if SME inactive >7 days
- **Real-Time Alerts**: Notifies stakeholders of issues

### SME Safety Fund
- **Fee Collection**: 10% of AMM trading fees
- **Default Protection**: Covers investor losses from late-stage defaults
- **Community Governance**: Transparent fund management
- **Proportional Refunds**: Fair distribution to affected investors

### Technical Safeguards
- **Slippage Protection**: Configurable trading tolerances

## 📊 Token Economics

### PIT Token Structure
- **Type**: Semi-fungible NFT on XRPL
- **Backing**: Platform-based
- **Liquidity**: AMM pools provide instant trading
- **Governance**: Platform voting rights

### Fee Structure
- **Platform Fee**: ~$0.002 per transaction (XRPL network fee only)
- **Trading Fee**: 0.5% on AMM swaps
- **Safety Fund**: 10% of trading fees
- **No Hidden Costs**: Transparent, minimal fees

## 🎯 Regulatory Compliance

### MAS Sandbox Ready
- **DID Integration**: Verifiable identity for compliance
- **Audit Trail**: Complete transaction history on XRPL
- **KYC/AML**: Built-in verification workflows
- **Risk Management**: Automated safety mechanisms

### Documentation
- **Financial Tracking**: Real-time fund flow monitoring
- **Compliance Reporting**: Automated regulatory reports
- **Investor Protection**: Multi-layer safety nets

## 🚀 Deployment

### Production Checklist
- [ ] XRPL Mainnet configuration
- [ ] Real API integrations (Xero, PayNow)
- [ ] Security audit completion
- [ ] Watch-tower deployment

### Scaling Considerations
- **XRPL Performance**: 1,500+ TPS capacity
- **Database Optimization**: PostgreSQL with Redis caching
- **CDN Integration**: Global content delivery
- **Monitoring**: Comprehensive observability stack

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

### Code Structure
- **Services**: XRPL integration in `src/lib/xrpl/`
- **Components**: React components in `src/components/`
- **State**: Zustand store in `src/store/`
- **Types**: TypeScript definitions in `src/types/`

## 📈 Roadmap

### Phase 1: MVP (Current)
- ✅ Core XRPL integration
- ✅ Campaign creation wizard
- ✅ AMM trading interface
- ✅ Watch-tower safety mechanisms

### Phase 2: Production (Month 1-3)
- [ ] MAS sandbox integration
- [ ] Real API integrations (Xero, PayNow)
- [ ] Advanced analytics dashboard
- [ ] Mobile PWA optimization
- [ ] Security audit & penetration testing

### Phase 3: Scale (Month 3-6)
- [ ] Multi-currency support
- [ ] Cross-chain bridges (Axelar)
- [ ] Advanced DeFi features
- [ ] Institutional investor tools
- [ ] Global expansion

### Phase 4: Ecosystem (Month 6-12)
- [ ] SME lending protocols
- [ ] Insurance marketplace
- [ ] Credit scoring DAO
- [ ] Secondary market features
- [ ] Enterprise partnerships

## 📞 Support

### Documentation
- **XRPL Docs**: https://xrpl.org/docs
- **API Reference**: `/docs/api`
- **Integration Guide**: `/docs/integration`

### Community
- **Discord**: [Community Server]
- **GitHub**: [Issues & Discussions]
- **Email**: support@crowdlift.platform

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ on XRPL for the future of SME financing**

## 🚀 Demo Video

[![Watch the demo](https://img.youtube.com/vi/your-demo-video-id/0.jpg)](https://youtu.be/your-demo-video-id)

> _Click the image above to watch a full walkthrough of CrowdLift, including campaign creation, wallet integration, and real XRPL transactions._

## 🖼️ Screenshots

| Launch Campaign | Browse Campaigns | Portfolio |
|----------------|------------------|-----------|
| ![Launch](<img width="1470" alt="image" src="https://github.com/user-attachments/assets/52aa85ee-c2db-4878-8e50-2368d2878534" />| ![Browse](<img width="1470" alt="image" src="https://github.com/user-attachments/assets/4718b021-6c3e-4370-9f33-061f41eb88f0" />| ![Portfolio](<img width="1470" alt="image" src="https://github.com/user-attachments/assets/20830817-076b-4fc1-9e1a-e363f5bc72be" />|

## 💡 How CrowdLift Works with the XRP Ledger

- **Wallet Integration:** Users connect or import an XRPL wallet (testnet) directly in the browser.
- **Campaign Creation:** When a campaign is launched, a new token is defined and associated with the campaign. The campaign is stored in a shared JSON file, accessible to all clients on the network.
- **Trust Lines:** Investors can create trust lines for campaign tokens using real XRPL transactions.
- **Token Purchase:** Investors send XRP to the campaign issuer, and the issuer sends campaign tokens back, all via XRPL Payment transactions.
- **Portfolio:** Users can view their XRP and token balances, fetched live from the XRPL testnet.
- **All transactions are signed and submitted via xrpl.js, and can be viewed on the XRPL testnet block explorer.**

## 🎥 Video Walkthrough & Repo Structure

[![Watch the walkthrough](https://img.youtube.com/vi/your-walkthrough-video-id/0.jpg)](https://youtu.be/your-walkthrough-video-id)

- Explains the project, code structure, and demonstrates all features live.
- Shows real transactions on the XRPL testnet.
- Explains how the app satisfies all hackathon requirements.

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
   - Campaigns JSON: [http://localhost:3000/campaigns](http://localhost:3000/campaigns)

## 📝 Notes

- All campaign data is stored in `src/data/mockdata.json` and shared across the network.
- The app simulates KYC with a loading overlay after campaign creation.
- All XRPL transactions are real and can be viewed on the testnet explorer.
