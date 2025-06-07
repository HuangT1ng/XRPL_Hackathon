import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Landing } from '@/pages/Landing';
import { CampaignDetail } from '@/pages/CampaignDetail';
import { Portfolio } from '@/pages/Portfolio';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;