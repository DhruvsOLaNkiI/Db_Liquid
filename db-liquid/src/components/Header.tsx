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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-xl font-display font-bold text-xl">
              DB
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">Liquid</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="/home#how-it-works" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">How It Works</a>
            <a href="/home#faq" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">FAQ</a>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">My Bid</Link>
            <Link to="/seller/dashboard" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">My Listings</Link>
            <Link to="/home#ecosystem" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">DB Asset / DB Expo</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  <span>{user.name}</span>
                </Link>
                {isAuthenticated && (
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
                        className="absolute right-0 top-full mt-2 w-[340px] origin-top-right z-[100]"
                      >
                        <CreditWalletPanel onClose={() => setCreditPanelOpen(false)} />
                      </div>
                    )}
                  </div>
                )}
                <span
                  className="hidden lg:inline text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded max-w-[140px] truncate"
                  title={user.id}
                >
                  ID: {user.id.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={loginHref}
                  className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to={signupHref}
                  className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-4">
          <a href="/home#how-it-works" className="block text-base font-medium text-gray-900" onClick={() => setIsMenuOpen(false)}>How It Works</a>
          <a href="/home#faq" className="block text-base font-medium text-gray-900" onClick={() => setIsMenuOpen(false)}>FAQ</a>
          <Link to="/" className="block text-base font-medium text-gray-900" onClick={() => setIsMenuOpen(false)}>My Bid</Link>
          <Link to="/seller/dashboard" className="block text-base font-medium text-gray-900" onClick={() => setIsMenuOpen(false)}>My Listings</Link>
          <Link to="/home#ecosystem" className="block text-base font-medium text-gray-900" onClick={() => setIsMenuOpen(false)}>DB Asset / DB Expo</Link>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm text-gray-600 text-center hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Signed in as <span className="font-medium text-gray-900">{user.name}</span>
                </Link>
                <p className="text-[10px] font-mono text-gray-400 text-center break-all px-2">
                  ID: {user.id}
                </p>
                {isAuthenticated && (
                  <div className="px-2">
                    <BuyerCreditsPanel compact />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-center px-5 py-2.5 rounded-full text-base font-medium border border-gray-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={loginHref}
                  className="w-full text-center px-5 py-2.5 rounded-full text-base font-medium border border-gray-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to={signupHref}
                  className="w-full text-center bg-primary text-white px-5 py-2.5 rounded-full text-base font-medium"
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
