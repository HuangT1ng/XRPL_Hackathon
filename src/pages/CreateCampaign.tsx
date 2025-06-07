import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { createCampaign, isLoading, error } = useStore();

  const handleSubmit = async (formData: any) => {
    try {
      const campaignId = await createCampaign(formData);
      // Redirect to browse campaigns page after successful creation
      navigate('/campaigns');
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  // ... rest of your component code ...
} 