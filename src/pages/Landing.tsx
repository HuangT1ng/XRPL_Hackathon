import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, Users, Zap, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { xrplCampaignService } from '@/lib/xrpl/campaigns';
import { config } from '@/lib/config';

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

export function Landing() {
  const { setCampaigns, campaigns, wallet, connectWallet, isLoading } = useStore();
  const ISSUER_ADDRESS = 'rP9g3QyYkGZUvB9k2v6so7qA3iF4b1Bw8X';
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const onChainCampaigns = await xrplCampaignService.getIssuerCampaigns(ISSUER_ADDRESS);
      setCampaigns(onChainCampaigns);
    };

    if (campaigns.length === 0) {
      fetchCampaigns();
    }
  }, [setCampaigns, campaigns.length]);

  // Fetch featured campaigns from server
  useEffect(() => {
    fetch('http://localhost:3000/campaigns')
      .then(res => res.json())
      .then(data => setFeaturedCampaigns(data))
      .catch(() => setFeaturedCampaigns([]));
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            >
              Democratize Pre-IPO
              <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent"> Investments</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-gray-600"
            >
              CrowdLift enables SMEs to tokenize fundraising campaigns with milestone-based escrows on XRPL. 
              Investors can trade PIT tokens, provide liquidity, and track progress in real-time.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              {!wallet.isConnected ? (
                <Button 
                  onClick={() => connectWallet()} 
                  disabled={isLoading}
                  size="lg"
                  className="bg-primary-600 hover:bg-primary-700 text-black"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/onboard">
                      Launch Campaign
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/portfolio">
                      View Portfolio
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>
          </div>
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
            {featuredCampaigns.map((campaign, index) => (
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
              <Link to="/campaigns">
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