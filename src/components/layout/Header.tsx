import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, KeyRound } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const navigation = [
  { name: 'Discover', href: '/' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Launch Campaign', href: '/onboard' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const location = useLocation();
  const { wallet, connectWallet, disconnectWallet, isLoading } = useStore();

  const handleWalletAction = () => {
    if (wallet.isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const handleImportWallet = () => {
    if (secretKey) {
      connectWallet(secretKey);
      setImportDialogOpen(false);
      setSecretKey('');
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <Logo />
            </Link>
          </div>
          
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-semibold leading-6 transition-colors',
                  location.pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-900 hover:text-blue-600'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
            {wallet.isConnected && (
              <div className="text-sm text-gray-600">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </div>
            )}
            <Button
              onClick={handleWalletAction}
              disabled={isLoading}
              variant={wallet.isConnected ? 'destructive' : 'outline'}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Create Wallet'}
            </Button>
            {!wallet.isConnected && (
              <Button
                onClick={() => setImportDialogOpen(true)}
                disabled={isLoading}
                variant="secondary"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Import Wallet
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Import Wallet Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Wallet for Demo</DialogTitle>
            <DialogDescription>
              Enter the secret key of the wallet you want to use. This is for local development and demo purposes only.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secret" className="text-right">
                Secret Key
              </Label>
              <Input
                id="secret"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="col-span-3"
                placeholder="sEd..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleImportWallet}
              disabled={!secretKey || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Wallet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile menu overlay */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileMenu}
            />
            
            {/* Mobile menu panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                duration: 0.4
              }}
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-xl sm:max-w-sm"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <Logo />
                  <button
                    type="button"
                    className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <span className="sr-only">Close menu</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                {/* Navigation */}
                <div className="flex-1 px-6 py-6">
                  <div className="space-y-1">
                    {navigation.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <Link
                          to={item.href}
                          className={cn(
                            'block rounded-lg px-3 py-3 text-base font-semibold transition-colors',
                            location.pathname === item.href
                              ? 'text-blue-600 bg-blue-50 border border-blue-200'
                              : 'text-gray-900 hover:bg-gray-50 hover:text-blue-600'
                          )}
                          onClick={closeMobileMenu}
                        >
                          {item.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-6">
                  <Button
                    onClick={() => {
                      handleWalletAction();
                      closeMobileMenu();
                    }}
                    disabled={isLoading}
                    variant={wallet.isConnected ? 'success' : 'outline'}
                    className="w-full h-12"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isLoading ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}