import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CampaignCreationWizard } from '@/components/campaign/CampaignCreationWizard';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import { Button } from '@/components/ui/button';

export function CampaignOnboard() {
  const navigate = useNavigate();
  const { wallet } = useStore();

  const handleCampaignCreated = async (campaignId: string, campaignData: any) => {
    toast.success('Campaign created successfully!');
    try {
      // First, load existing campaigns
      const response = await fetch('/api/load-campaigns');
      let campaigns = [];
      if (response.ok) {
        const data = await response.json();
        campaigns = data.campaigns || [];
      } else if (response.status !== 404) {
         throw new Error('Failed to load existing campaigns');
      }

      // Add the new campaign
      const newCampaign = {
        id: campaignId,
        ...campaignData,
        founderAddress: wallet.address, // Keep wallet address for ownership info
        createdAt: new Date().toISOString()
      };
      campaigns.push(newCampaign);

      // Save the updated list of campaigns
      const saveResponse = await fetch('/api/save-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaigns }),
      });

      if (!saveResponse.ok) {
          throw new Error('Failed to save campaign');
      }
      
      const result = await saveResponse.json();
      log.info(result.message);

    } catch (error) {
      log.error('Error saving campaign:', error);
      toast.error('Could not save campaign to server.');
    }
    
    navigate(`/campaign/${campaignId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Launch Your Campaign
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Create a tokenized fundraising campaign on XRPL with milestone-based escrows
          </p>
          {wallet.isConnected && (
            <div className="mt-4 inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
              Wallet Connected: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <CampaignCreationWizard onComplete={handleCampaignCreated} />
        </motion.div>
      </div>
    </div>
  );
} 