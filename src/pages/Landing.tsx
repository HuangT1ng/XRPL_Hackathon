import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CampaignCard } from '@/components/campaign/CampaignCard';
import { useStore } from '@/store/useStore';
import { mockCampaigns } from '@/data/mockData';

const features = [
  {
    icon: Shield,
    title: 'Milestone-Based Security',
    description: 'Funds are released in tranches based on verified milestone completion, protecting investor interests.',
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
  const { setCampaigns, campaigns } = useStore();

  useEffect(() => {
    setCampaigns(mockCampaigns);
  }, [setCampaigns]);

  return (
    <div className="flex-1">
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
            </motion.div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-300 to-primary-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose CrowdLift?
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Built on XRPL for security, transparency, and liquidity
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Campaigns
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Discover innovative SMEs raising capital through tokenization
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-3">
            {campaigns.slice(0, 3).map((campaign, index) => (
              <CampaignCard key={campaign.id} campaign={campaign} index={index} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/discover">
                View All Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-100">
              Whether you're an SME looking to raise capital or an investor seeking pre-IPO opportunities, 
              CrowdLift provides the tools and security you need.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild variant="outline" size="lg">
                <Link to="/onboard">
                  Launch Campaign
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/portfolio">
                  Start Investing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}