import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Discover', href: '/' },
  { name: 'Browse Campaigns', href: '/campaigns' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Launch Campaign', href: '/onboard' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { wallet, connectWallet, disconnectWallet, isLoading } = useStore();

  const handleWalletAction = () => {
    if (wallet.isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-md rounded-b-2xl font-[Poppins]">
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Logo />
              <span className="font-bold text-xl text-primary-700 tracking-tight text-black" style={{ fontFamily: 'Poppins, sans-serif' }}>CrowdLift</span>
            </Link>
          </div>
          <div className="hidden lg:flex gap-x-10 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-lg font-semibold px-3 py-1 rounded-lg transition-all duration-200',
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-primary-500 to-primary-700 text-black shadow-md scale-105'
                    : 'text-gray-700 hover:text-primary-600 hover:scale-105 hover:bg-primary-50'
                )}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {wallet.isConnected && (
              <div className="text-base font-mono bg-primary-100 text-primary-700 px-3 py-1 rounded-lg shadow-sm">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </div>
            )}
            <Button
              onClick={handleWalletAction}
              disabled={isLoading}
              variant={wallet.isConnected ? 'destructive' : 'outline'}
              className="rounded-lg px-5 py-2 text-base font-semibold shadow hover:scale-105 transition-all"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <Wallet className="mr-2 h-5 w-5" />
              {isLoading ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
            </Button>
          </div>
          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

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
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white shadow-xl sm:max-w-sm rounded-l-2xl"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <Logo />
                  <button
                    type="button"
                    className="rounded-md p-2.5 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <span className="sr-only">Close menu</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                {/* Navigation */}
                <div className="flex-1 px-6 py-6">
                  <div className="space-y-2">
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
                            'block rounded-lg px-4 py-3 text-lg font-semibold transition-all',
                            location.pathname === item.href
                              ? 'bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-md scale-105'
                              : 'text-gray-700 hover:text-primary-600 hover:scale-105 hover:bg-primary-50'
                          )}
                          onClick={closeMobileMenu}
                          style={{ fontFamily: 'Poppins, sans-serif' }}
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
                    className="w-full h-12 rounded-lg text-lg font-semibold shadow"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
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