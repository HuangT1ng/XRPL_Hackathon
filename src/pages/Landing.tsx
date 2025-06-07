import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, Users, Zap, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { crowdLiftXRPL } from '@/lib/xrpl';

const features = [
  {
    icon: Shield,
    title: 'AI Based KYC',
    description: 'KYC is done via AI, ensuring that only legitimate businesses can participate.',
  },
  {
    icon: TrendingUp,
    title: 'Pre-IPO Tokenization',
    description: 'Access early-stage investment opportunities through tokenized equity with real liquidity.',
  },
  {
    icon: Users,
    title: 'AMM Liquidity Pools',
    description: 'Trade PIT tokens on XRPL AMMs with competitive spreads and earn fees as a liquidity provider.',
  },
  {
    icon: Zap,
    title: 'Real-Time Transparency',
    description: 'Track milestone progress, funding status, and escrow releases in real-time on XRPL.',
  },
];

// Mock campaign data for beautiful cards
const mockCampaigns = [
  {
    id: '1',
    name: 'GreenBrew Coffee Expansion',
    industry: 'Food & Beverage',
    description: 'Raising funds to open 5 new eco-friendly coffee shops in Singapore.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    fundingGoal: 100000,
    currentFunding: 65000,
    founder: 'Eco Ventures',
  },
  {
    id: '2',
    name: 'MedTech AI Diagnostics',
    industry: 'Healthcare',
    description: 'AI-powered diagnostics for faster, more accurate patient care.',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80',
    fundingGoal: 200000,
    currentFunding: 120000,
    founder: 'HealthNext',
  },
  {
    id: '3',
    name: 'EduSpark Learning Platform',
    industry: 'Education',
    description: 'Interactive online platform making STEM fun for kids.',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
    fundingGoal: 50000,
    currentFunding: 42000,
    founder: 'SparkEd',
  },
  {
    id: '4',
    name: 'UrbanSmart Mobility',
    industry: 'Technology',
    description: 'Smart e-scooter sharing for urban commuters.',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    fundingGoal: 150000,
    currentFunding: 90000,
    founder: 'UrbanSmart',
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { campaigns, setCampaigns, wallet, connectWallet, isLoading } = useStore();
  const [seedInput, setSeedInput] = useState('');
  const [seedStored, setSeedStored] = useState(() => !!localStorage.getItem('xrpl_wallet_seed'));

  const handleSeedSubmit = () => {
    if (seedInput.trim()) {
      localStorage.setItem('xrpl_wallet_seed', seedInput.trim());
      setSeedStored(true);
      setSeedInput('');
      connectWallet();
    }
  };

  const handleConnectClick = () => {
    connectWallet();
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (wallet.isConnected && wallet.xrplWallet) {
        try {
          const activeCampaigns = await crowdLiftXRPL.campaigns.getActiveCampaigns(wallet.xrplWallet);
          setCampaigns(activeCampaigns);
        } catch (error) {
          console.error('Failed to fetch campaigns:', error);
        }
      }
    };

    fetchCampaigns();
  }, [wallet.isConnected, wallet.xrplWallet, setCampaigns]);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 w-full overflow-hidden">
        <div className="w-full px-4 py-20 sm:py-28 flex flex-col items-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-7xl font-extrabold text-gray-900 text-center mb-4"
          >
            Democratize
            <br /> Pre-IPO Investments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-xl sm:text-2xl text-gray-600 max-w-2xl text-center"
          >
            CrowdLift enables SMEs to tokenize fundraising campaigns with tokens on XRPL. Investors can trade PIT tokens, provide liquidity, and track progress in real-time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
          </motion.div>
        </div>
        {/* Decorative background blob */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-gradient-to-tr from-primary-200 via-primary-100 to-white rounded-full blur-3xl opacity-40 z-0" />
      </section>

      {/* Features Section */}
      <section className="py-12 w-full bg-white">
        <div className="w-full px-4 max-w-6xl mx-auto">
          <div className="w-full text-center mb-10">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Why Choose CrowdLift?</h2>
            <p className="text-lg leading-8 text-gray-600">
              Built on XRPL for security, transparency, and liquidity
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-primary-50 rounded-2xl shadow p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-8 w-8 text-primary-600 mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-100 py-16 w-full">
        <div className="w-full px-4 max-w-6xl mx-auto">
          <div className="w-full text-center mb-10">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Featured Campaigns</h2>
            <p className="text-lg leading-8 text-gray-600">
              Discover innovative SMEs raising capital through tokenization
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockCampaigns.slice(0, 3).map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow p-0 flex flex-col overflow-hidden border border-gray-100"
              >
                <img src={campaign.image} alt={campaign.name} className="h-48 w-full object-cover" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-primary-100 text-primary-700 rounded px-2 py-1 font-semibold">{campaign.industry}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-1 text-gray-900">{campaign.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{campaign.description}</p>
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all"
                        style={{ width: `${(campaign.currentFunding / campaign.fundingGoal) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>${campaign.currentFunding.toLocaleString()} raised</span>
                      <span>Goal: ${campaign.fundingGoal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button asChild className="mt-auto w-full bg-black text-white hover:bg-gray-900 hover:text-white border-none shadow-lg transition-all duration-200" variant="outline">
                    <Link to={`/campaign/${campaign.id}`}>View Details</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/discover" className="text-black">
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 bg-white">
        <div className="w-full px-4 flex flex-col items-center text-center">
          <p className="text-2xl text-gray-700 mb-6 max-w-2xl">
            Whether you're an SME looking to raise capital or an investor seeking pre-IPO opportunities, CrowdLift provides the tools and security you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/onboard" className="text-black">
                Launch Campaign
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/portfolio" className="text-black">
                Start Investing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}