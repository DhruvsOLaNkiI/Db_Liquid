import { ChevronDown, Coins, LogOut, Menu, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BuyerCreditsPanel } from './BuyerCreditsPanel';
import { CreditWalletPanel } from './CreditWalletPanel';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [creditPanelOpen, setCreditPanelOpen] = useState(false);
  const creditButtonRef = useRef<HTMLButtonElement>(null);
  const { user, isAuthenticated, logout, buyerCredits } = useAuth();

  const loginHref = '/login';
  const signupHref = '/signup';

  useEffect(() => {
    if (!creditPanelOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (creditButtonRef.current?.contains(target)) return;
      const panel = document.getElementById('credit-wallet-panel');
      if (panel?.contains(target)) return;
      setCreditPanelOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setCreditPanelOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [creditPanelOpen]);

  const navLinks = (
    <>
      <Link to="/how-it-works" className="nav-link">How It Works</Link>
      <Link to="/faq" className="nav-link">FAQ</Link>
      <Link to="/browse-property" className="nav-link">My Bid</Link>
      <Link to="/seller/dashboard" className="nav-link">My Listings</Link>
      <Link to="/home#ecosystem" className="nav-link">DB Asset / DB Expo</Link>
    </>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 navbar-bar">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 lg:h-[60px] gap-4 lg:gap-8">
          <Link to="/" className="flex items-center shrink-0 min-w-[120px]">
            <img
              src="/db-liquid-logo.png"
              alt="DB Liquid"
              className="h-9 lg:h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-8">
            {navLinks}
          </nav>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto shrink-0">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
                >
                  <User size={16} className="text-white/70" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </Link>
                <div className="relative">
                  <button
                    ref={creditButtonRef}
                    type="button"
                    onClick={() => setCreditPanelOpen((open) => !open)}
                    aria-expanded={creditPanelOpen}
                    aria-controls="credit-wallet-panel"
                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      creditPanelOpen
                        ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <Coins size={14} />
                    {buyerCredits}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${creditPanelOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {creditPanelOpen && (
                    <div
                      id="credit-wallet-panel"
                      className="absolute right-0 top-full mt-2 w-[340px] origin-top-right z-[200]"
                    >
                      <CreditWalletPanel onClose={() => setCreditPanelOpen(false)} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden xl:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={loginHref}
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to={signupHref}
                  className="bg-accent text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-white/90 hover:text-white ml-auto"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-white/15 bg-black/20 px-4 py-4 space-y-3">
          <Link to="/how-it-works" className="block text-sm font-medium text-white/90 py-1" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
          <Link to="/faq" className="block text-sm font-medium text-white/90 py-1" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
          <Link to="/browse-property" className="block text-sm font-medium text-white/90 py-1" onClick={() => setIsMenuOpen(false)}>My Bid</Link>
          <Link to="/seller/dashboard" className="block text-sm font-medium text-white/90 py-1" onClick={() => setIsMenuOpen(false)}>My Listings</Link>
          <Link to="/home#ecosystem" className="block text-sm font-medium text-white/90 py-1" onClick={() => setIsMenuOpen(false)}>DB Asset / DB Expo</Link>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm text-white/75 text-center hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Signed in as <span className="font-medium text-white">{user.name}</span>
                </Link>
                <div className="px-2">
                  <BuyerCreditsPanel compact />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-center px-5 py-2.5 rounded-md text-sm font-medium border border-white/20 text-white/90"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={loginHref}
                  className="w-full text-center px-5 py-2.5 rounded-md text-sm font-medium border border-white/20 text-white/90"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to={signupHref}
                  className="w-full text-center bg-accent text-white px-5 py-2.5 rounded-md text-sm font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
