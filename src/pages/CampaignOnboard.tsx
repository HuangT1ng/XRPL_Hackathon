import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CampaignCreationWizard } from '@/components/campaign/CampaignCreationWizard';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

export function CampaignOnboard() {
  const navigate = useNavigate();
  const { wallet } = useStore();


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
          <CampaignCreationWizard />
        </motion.div>
      </div>
    </div>
  );
} 