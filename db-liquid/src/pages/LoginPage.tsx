import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/user';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const ROLE_REDIRECT: Record<UserRole, string> = {
  seller: '/list-your-property/create',
  buyer: '/browse-property',
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const initialRole = (searchParams.get('role') === 'buyer' ? 'buyer' : 'seller') as UserRole;
  const nextPath = searchParams.get('next');

  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const result = login(email, password, role);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(nextPath || ROLE_REDIRECT[role]);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Welcome back</h1>
            <p className="text-gray-600">Log in to your DB Liquid account.</p>
          </div>

          <div className="flex rounded-full bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                role === 'buyer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                role === 'seller' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-full font-medium text-lg hover:bg-gray-800 transition-colors"
            >
              Log in as {role}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to={`/signup?role=${role}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
