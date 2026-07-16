import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';

type AuthTab = 'login' | 'signup';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 focus:border-[#FF7A00] transition-colors';

export function ListPropertyLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, sessionReady, login, signup } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionReady && isAuthenticated) {
      navigate('/list-your-property/create', { replace: true });
    }
  }, [sessionReady, isAuthenticated, navigate]);

  if (!sessionReady || isAuthenticated) {
    return null;
  }

  function switchTab(next: AuthTab) {
    setTab(next);
    setError('');
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/list-your-property/create', { replace: true });
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signup({ name, email, phone, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/list-your-property/create', { replace: true });
  };

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900 dark-theme-page">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Almost done!</h1>
            <p className="text-gray-400 text-sm">
              Choose an existing account or create a new one to publish your listing. Your details
              are saved.
            </p>
          </div>

          {/* Both options visible — only one form active */}
          <div className="flex rounded-full bg-white/5 border border-white/10 p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === 'login'
                  ? 'bg-[#FF7A00] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Existing account
            </button>
            <button
              type="button"
              onClick={() => switchTab('signup')}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === 'signup'
                  ? 'bg-[#FF7A00] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create new account
            </button>
          </div>

          <div className="bg-white/5 rounded-3xl p-6 sm:p-8 border border-white/10">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="list-login-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="list-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="list-login-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="list-login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#FF7A00] text-white rounded-full font-medium text-lg hover:bg-[#E66E00] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Logging in…' : 'Log in'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="text-center mb-1">
                  <h2 className="text-xl font-bold text-white">Create your account</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Buy properties, place bids, and list your own — all with one login.
                  </p>
                </div>

                <div>
                  <label htmlFor="list-signup-name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full name
                  </label>
                  <input
                    id="list-signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="list-signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="list-signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="list-signup-phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone number
                  </label>
                  <input
                    id="list-signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    autoComplete="tel"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for bids and deal chat</p>
                </div>

                <div>
                  <label htmlFor="list-signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="list-signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#FF7A00] text-white rounded-full font-medium text-lg hover:bg-[#E66E00] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/list-your-property/create')}
            className="w-full mt-5 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            ← Back to your listing
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">
            <Link to="/" className="font-medium text-gray-400 hover:text-[#FF7A00] transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
