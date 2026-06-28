import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { BuyerCreditsPanel } from '../components/BuyerCreditsPanel';
import { PropertyListingCard } from '../components/PropertyListingCard';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { loadSampleListingsForBrowse } from '../utils/testDataExcel';

export function BrowsePropertyPage() {
  const { listings, reloadListings } = useListings();
  const { isAuthenticated, hasRole, user } = useAuth();
  const isBuyer = isAuthenticated && hasRole('buyer');
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState('');

  useEffect(() => {
    reloadListings();
  }, [reloadListings]);

  useEffect(() => {
    const refresh = () => reloadListings();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reloadListings]);

  async function handleLoadSampleListings() {
    setLoadingSample(true);
    setSampleError('');
    try {
      const result = await loadSampleListingsForBrowse();
      reloadListings();
      if (result.listings === 0) {
        setSampleError('No listings found in the sample Excel file.');
      }
    } catch {
      setSampleError('Could not load sample listings. Go to Prototype → Load sample Excel.');
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Browse listings</h1>
              <p className="text-gray-600">
                {listings.length > 0
                  ? `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} open for bidding`
                  : isBuyer
                    ? 'No properties to bid on yet. Sellers must publish first.'
                    : 'No listings yet. Be the first to list your property.'}
              </p>
            </div>
            {!isBuyer && (
              <div className="flex gap-2 shrink-0">
                <Link
                  to="/login?role=buyer"
                  className="px-5 py-2.5 rounded-full text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  Buyer log in
                </Link>
                <Link
                  to="/signup?role=buyer"
                  className="px-5 py-2.5 rounded-full text-sm font-medium bg-primary text-white hover:bg-gray-800 transition-colors"
                >
                  Sign up as buyer
                </Link>
              </div>
            )}
            {isBuyer && user && (
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
                <BuyerCreditsPanel compact />
              </div>
            )}
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing.id}>
                  <PropertyListingCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              {isBuyer ? (
                <>
                  <p className="text-gray-600 mb-2 font-medium">You are on the buyer side.</p>
                  <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                    Data is stored in <strong>MongoDB</strong> (shared for all buyers and sellers).
                    If a seller just published, wait a few seconds or click Refresh.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      disabled={loadingSample}
                      onClick={() => void handleLoadSampleListings()}
                      className="inline-block px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {loadingSample ? 'Loading…' : 'Load sample listings to bid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => reloadListings()}
                      className="inline-block px-8 py-4 border border-gray-200 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                  {sampleError && (
                    <p className="mt-4 text-sm text-red-600">{sampleError}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-2">Published listings will appear here for everyone to browse.</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Sellers must click <strong>Publish listing</strong> on the last step of the listing wizard.
                  </p>
                  <Link
                    to="/list-your-property"
                    className="inline-block px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                  >
                    List your property
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
