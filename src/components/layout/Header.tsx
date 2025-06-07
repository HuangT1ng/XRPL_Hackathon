import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Discover', href: '/' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Launch Campaign', href: '/onboard' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { wallet, connectWallet, disconnectWallet, isDarkMode, toggleDarkMode, isLoading } = useStore();

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
                    ? 'text-primary-600'
                    : 'text-gray-900 hover:text-primary-600'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={handleWalletAction}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
            </Button>
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
                              ? 'text-primary-600 bg-primary-50 border border-primary-200'
                              : 'text-gray-900 hover:bg-gray-50 hover:text-primary-600'
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
                <div className="border-t border-gray-200 px-6 py-6 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">Dark Mode</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleDarkMode}
                      className="rounded-full h-10 w-10"
                    >
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={() => {
                        handleWalletAction();
                        closeMobileMenu();
                      }}
                      disabled={isLoading}
                      className="w-full bg-primary-600 hover:bg-primary-700 h-12"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {isLoading ? 'Connecting...' : wallet.isConnected ? 'Disconnect' : 'Connect Wallet'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}