import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { crowdLiftXRPL } from '@/lib/xrpl';
import { toast } from 'sonner';

export function TestXRPL() {
  const { wallet, connectWallet } = useStore();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const testXRPLConnection = async () => {
    try {
      addResult('Testing XRPL connection...');
      await crowdLiftXRPL.initialize();
      addResult('✅ XRPL connection successful');
    } catch (error) {
      addResult(`❌ XRPL connection failed: ${error}`);
    }
  };

  const testWalletGeneration = async () => {
    try {
      addResult('Testing wallet generation...');
      await connectWallet();
      if (wallet.isConnected) {
        addResult(`✅ Wallet generated: ${wallet.address}`);
      }
    } catch (error) {
      addResult(`❌ Wallet generation failed: ${error}`);
    }
  };

  const testCreditScoring = async () => {
    try {
      addResult('Testing credit scoring...');
      const mockFinancialData = {
        revenue: 500000,
        cashFlow: 50000,
        assets: 200000,
        liabilities: 100000,
        paymentHistory: 85,
        businessAge: 3
      };
      
      const { score, hash } = await crowdLiftXRPL.identity.computeCreditScore(mockFinancialData);
      addResult(`✅ Credit score computed: ${score}/1000 (Hash: ${hash.slice(0, 8)}...)`);
    } catch (error) {
      addResult(`❌ Credit scoring failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            XRPL Integration Test
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Test the XRPL services integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testXRPLConnection} className="w-full">
                Test XRPL Connection
              </Button>
              
              <Button onClick={testWalletGeneration} className="w-full">
                Test Wallet Generation
              </Button>
              
              <Button onClick={testCreditScoring} className="w-full">
                Test Credit Scoring
              </Button>
              
              <Button onClick={clearResults} variant="outline" className="w-full">
                Clear Results
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">No test results yet...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Status */}
        {wallet.isConnected && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Wallet Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Address:</span> {wallet.address}
                </div>
                <div>
                  <span className="font-medium">Network:</span> {wallet.network}
                </div>
                <div>
                  <span className="font-medium">Balance:</span> {wallet.balance} XRP
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className="ml-1 text-green-600">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 