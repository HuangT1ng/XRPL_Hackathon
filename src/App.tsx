import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { CampaignDetail } from '@/pages/CampaignDetail';
import { Portfolio } from '@/pages/Portfolio';
import { CampaignOnboard } from '@/pages/CampaignOnboard';
import { TestXRPL } from '@/pages/TestXRPL';
import { SupportCampaign } from '@/pages/SupportCampaign';
import DebugPage from '@/pages/DebugPage';
import { Toaster } from '@/components/ui/sonner';
import { BrowseCampaigns } from '@/pages/BrowseCampaigns';
import './css/App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/campaigns" element={<BrowseCampaigns />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/campaign/:id/support" element={<SupportCampaign />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/onboard" element={<CampaignOnboard />} />
            <Route path="/test" element={<TestXRPL />} />
            <Route path="/debug" element={<DebugPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;