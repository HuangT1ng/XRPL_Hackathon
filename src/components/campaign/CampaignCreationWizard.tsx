import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Building, Coins, Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

interface CampaignData {
  // Company Information
  companyName: string;
  industry: string;
  description: string;
  website: string;
  registrationNumber?: string;
  yearFounded?: string;
  companySize?: string;
  headquarters?: string;
  contactEmail?: string;
  linkedin?: string;
  
  // Campaign Details
  name: string;
  fundingGoal: number;
  tokenSymbol: string;
  tokenPrice: number;
  totalSupply: number;
  
  // Timeline
  launchDate: string;
  endDate: string;
}

const STEPS = [
  { id: 'company', title: 'Company Info', icon: Building },
  { id: 'campaign', title: 'Campaign Details', icon: Target },
  { id: 'tokenomics', title: 'Tokenomics', icon: Coins },
  { id: 'review', title: 'Review & Launch', icon: Check }
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Food & Beverage',
  'Manufacturing', 'Real Estate', 'Education', 'Entertainment', 'Other'
];

export function CampaignCreationWizard({ onComplete }: { onComplete: (campaignId: string) => void }) {
  const { createCampaign, wallet, isLoading } = useStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    companyName: '',
    industry: '',
    description: '',
    website: '',
    registrationNumber: '',
    yearFounded: '',
    companySize: '',
    headquarters: '',
    contactEmail: '',
    linkedin: '',
    name: '',
    fundingGoal: 0,
    tokenSymbol: '',
    tokenPrice: 0,
    totalSupply: 0,
    launchDate: '',
    endDate: ''
  });

  const updateCampaignData = (field: string, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Company Info
        return !!(campaignData.companyName && campaignData.industry && campaignData.description);
      case 1: // Campaign Details
        return !!(campaignData.name && campaignData.fundingGoal > 0);
      case 2: // Tokenomics
        return !!(campaignData.tokenSymbol && campaignData.tokenPrice > 0 && campaignData.totalSupply > 0);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    log.info('WIZARD', '=== HANDLE SUBMIT CLICKED ===');
    log.debug('WIZARD', 'Current campaign data', campaignData);
    
    if (!wallet.isConnected) {
      log.error('WIZARD', 'Wallet not connected in handleSubmit');
      toast.error('Please connect your wallet first');
      return;
    }

    log.info('WIZARD', 'Starting campaign creation from wizard...');
    
    try {
      toast.info('Creating campaign on XRPL...');
      log.info('WIZARD', 'About to call createCampaign store method...');
      const campaignId = await createCampaign({
        name: campaignData.name,
        description: campaignData.description,
        industry: campaignData.industry,
        fundingGoal: campaignData.fundingGoal,
        tokenSymbol: campaignData.tokenSymbol,
        tokenPrice: campaignData.tokenPrice,
        totalSupply: campaignData.totalSupply,
        launchDate: new Date(campaignData.launchDate),
        endDate: new Date(campaignData.endDate),
        status: 'active' as const,
        createdAt: new Date(),
        founderAddress: wallet.address!,
        currentFunding: 0,
        circulatingSupply: 0,
        image: '/api/placeholder/400/300',
        amm: {
          poolId: 'pending',
          tvl: 0,
          apr: 0,
          depth: 0
        }
      });

      log.info('WIZARD', '🎉 Campaign created successfully in wizard!', { campaignId });
      toast.success('Campaign created successfully!');
      onComplete(campaignId);
    } catch (error) {
      log.error('WIZARD', '❌ Campaign creation error in wizard', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Company Info
        return (
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-full max-w-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={campaignData.companyName}
                  onChange={e => updateCampaignData('companyName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={campaignData.industry}
                  onValueChange={value => updateCampaignData('industry', value)}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Company Description *</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={e => updateCampaignData('description', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  value={campaignData.website}
                  onChange={e => updateCampaignData('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              {/* Optional fields */}
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number (optional)</Label>
                <Input
                  id="registrationNumber"
                  value={campaignData.registrationNumber}
                  onChange={e => updateCampaignData('registrationNumber', e.target.value)}
                  placeholder="e.g. 2024-123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearFounded">Year Founded (optional)</Label>
                <Input
                  id="yearFounded"
                  type="number"
                  value={campaignData.yearFounded}
                  onChange={e => updateCampaignData('yearFounded', e.target.value)}
                  placeholder="e.g. 2018"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size (optional)</Label>
                <Input
                  id="companySize"
                  value={campaignData.companySize}
                  onChange={e => updateCampaignData('companySize', e.target.value)}
                  placeholder="e.g. 10-50 employees"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headquarters">Headquarters Location (optional)</Label>
                <Input
                  id="headquarters"
                  value={campaignData.headquarters}
                  onChange={e => updateCampaignData('headquarters', e.target.value)}
                  placeholder="e.g. Singapore"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={campaignData.contactEmail}
                  onChange={e => updateCampaignData('contactEmail', e.target.value)}
                  placeholder="e.g. hello@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                <Input
                  id="linkedin"
                  value={campaignData.linkedin}
                  onChange={e => updateCampaignData('linkedin', e.target.value)}
                  placeholder="e.g. https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Campaign Details
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input
                id="campaignName"
                value={campaignData.name}
                onChange={(e) => updateCampaignData('name', e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fundingGoal">Funding Goal (RLUSD) *</Label>
              <Input
                id="fundingGoal"
                type="number"
                value={campaignData.fundingGoal}
                onChange={(e) => updateCampaignData('fundingGoal', Number(e.target.value))}
                placeholder="100000"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="launchDate">Launch Date</Label>
                <Input
                  id="launchDate"
                  type="date"
                  value={campaignData.launchDate}
                  onChange={(e) => updateCampaignData('launchDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignData.endDate}
                  onChange={(e) => updateCampaignData('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2: // Tokenomics
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenSymbol">Token Symbol *</Label>
              <Input
                id="tokenSymbol"
                value={campaignData.tokenSymbol}
                onChange={(e) => updateCampaignData('tokenSymbol', e.target.value.toUpperCase())}
                placeholder="PIT"
                maxLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tokenPrice">Token Price (RLUSD) *</Label>
              <Input
                id="tokenPrice"
                type="number"
                step="0.01"
                value={campaignData.tokenPrice}
                onChange={(e) => updateCampaignData('tokenPrice', Number(e.target.value))}
                placeholder="1.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalSupply">Total Supply *</Label>
              <Input
                id="totalSupply"
                type="number"
                value={campaignData.totalSupply}
                onChange={(e) => updateCampaignData('totalSupply', Number(e.target.value))}
                placeholder="1000000"
              />
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Token Economics Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Market Cap:</span>
                  <span>${(campaignData.tokenPrice * campaignData.totalSupply).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tokens for Funding:</span>
                  <span>{(campaignData.fundingGoal / campaignData.tokenPrice).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Review Your Campaign</h3>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Company:</span>
                    <span>{campaignData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Industry:</span>
                    <span>{campaignData.industry}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Campaign:</span>
                    <span>{campaignData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funding Goal:</span>
                    <span>${campaignData.fundingGoal.toLocaleString()} RLUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span>{campaignData.tokenSymbol} @ ${campaignData.tokenPrice}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8 flex justify-center">
        <div className="flex items-center justify-center gap-0 max-w-3xl w-full">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive ? 'border-primary-600 bg-primary-600 text-white' : 
                    isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                    'border-gray-300 bg-white text-gray-400'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`mx-4 h-0.5 w-16 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={prevStep}
          disabled={currentStep === 0}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !wallet.isConnected}
          >
            {isLoading ? 'Creating Campaign...' : 'Launch Campaign'}
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
} 