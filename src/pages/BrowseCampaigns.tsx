import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

const MOCK_CAMPAIGNS = [
  {
    id: 'mock1',
    name: 'GreenTech Solutions',
    description: 'Revolutionizing renewable energy for a sustainable future.',
    industry: 'Technology',
    fundingGoal: 100000,
    currentFunding: 42000,
    tokenSymbol: 'GTS',
    tokenPrice: 2,
    totalSupply: 50000,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    founderAddress: 'rMockAddress1',
    launchDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'mock2',
    name: 'HealthBridge',
    description: 'Connecting rural communities to quality healthcare.',
    industry: 'Healthcare',
    fundingGoal: 75000,
    currentFunding: 15000,
    tokenSymbol: 'HLB',
    tokenPrice: 1,
    totalSupply: 100000,
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    founderAddress: 'rMockAddress2',
    launchDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  {
    id: 'mock3',
    name: 'EduLift',
    description: 'Empowering students with affordable online education.',
    industry: 'Education',
    fundingGoal: 50000,
    currentFunding: 32000,
    tokenSymbol: 'EDU',
    tokenPrice: 0.5,
    totalSupply: 200000,
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    status: 'active',
    founderAddress: 'rMockAddress3',
    launchDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
];

export function BrowseCampaigns() {
  const { campaigns } = useStore();
  const navigate = useNavigate();
  const allCampaigns = campaigns && campaigns.length > 0 ? campaigns : MOCK_CAMPAIGNS;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Browse Campaigns</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCampaigns.map((campaign) => {
              const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;
              return (
                <Card key={campaign.id} className="flex flex-col">
                  <img
                    src={campaign.image}
                    alt={campaign.name}
                    className="h-40 w-full object-cover rounded-t-lg"
                  />
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">{campaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${fundingPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Goal</span>
                      <span className="font-medium">${campaign.fundingGoal.toLocaleString()} RLUSD</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Token</span>
                      <span className="font-medium">{campaign.tokenSymbol} @ ${campaign.tokenPrice}</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-black text-white hover:bg-gray-900 hover:text-white border-none shadow-lg transition-all duration-200"
                      onClick={() => navigate(`/campaign/${campaign.id}/support`)}
                    >
                      Support
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 