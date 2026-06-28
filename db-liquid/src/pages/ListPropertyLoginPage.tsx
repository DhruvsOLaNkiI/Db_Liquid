import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getOrCreateSellerId } from '../utils/seller';

export function ListPropertyLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated && hasRole('seller')) {
      navigate('/list-your-property/create', { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate]);

  if (isAuthenticated && hasRole('seller')) {
    return null;
  }

  const goToListingAsGuest = () => {
    getOrCreateSellerId();
    navigate('/list-your-property/create');
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">List your property</h1>
            <p className="text-gray-600">
              Create a seller account to manage listings, or continue as a guest.
            </p>
          </div>

          {isAuthenticated && hasRole('buyer') && !hasRole('seller') && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You are logged in as a buyer. To list property,{' '}
              <button type="button" onClick={goToListingAsGuest} className="font-semibold underline">
                continue as guest seller
              </button>{' '}
              or{' '}
              <Link to="/login?role=seller&next=/list-your-property/create" className="font-semibold underline">
                log in as seller
              </Link>
              .
            </div>
          )}

          <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-4">
            <Link
              to="/login?role=seller&next=/list-your-property/create"
              className="block w-full py-4 bg-primary text-white rounded-full font-medium text-lg text-center hover:bg-gray-800 transition-colors"
            >
              Log in as seller
            </Link>

            <Link
              to="/signup?role=seller&next=/list-your-property/create"
              className="block w-full py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-medium text-lg text-center hover:bg-gray-50 transition-colors"
            >
              Create seller account
            </Link>

            <button
              type="button"
              onClick={goToListingAsGuest}
              className="w-full py-4 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Skip for now — continue as guest
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/" className="font-medium text-gray-600 hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
