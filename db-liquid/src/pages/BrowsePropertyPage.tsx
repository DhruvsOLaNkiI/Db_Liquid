import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { filterListings, ListingFilters, type ListingStatusFilter } from '../components/ListingFilters';
import { PropertyListingCard } from '../components/PropertyListingCard';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';

export function BrowsePropertyPage() {
  const { listings, reloadListings } = useListings();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const type = searchParams.get('type') ?? 'all';
    if (q) setSearch(q);
    if (type !== 'all') setTypeFilter(type);
  }, [searchParams]);

  const propertyTypes = useMemo(
    () => [...new Set(listings.map((l) => l.propertyType))].sort(),
    [listings],
  );

  const filteredListings = useMemo(
    () => filterListings(listings, search, statusFilter, typeFilter),
    [listings, search, statusFilter, typeFilter],
  );

  async function handleLoadSampleListings() {
    setLoadingSample(true);
    setSampleError('');
    try {
      // Load xlsx (~420 KB) only when the button is clicked, not on page load.
      const { loadSampleListingsForBrowse } = await import('../utils/testDataExcel');
      const result = await loadSampleListingsForBrowse();
      reloadListings({ force: true });
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
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900 browse-page">
      <Header />
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          {(listings.length > 0 || search || typeFilter !== 'all') && (
            <ListingFilters
              search={search}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              propertyTypes={propertyTypes}
              resultCount={filteredListings.length}
              totalCount={listings.length}
              onSearchChange={setSearch}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
            />
          )}

          {listings.length > 0 ? (
            filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredListings.map((listing) => (
                  <div key={listing.id}>
                    <PropertyListingCard listing={listing} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center">
                <p className="text-white/90 mb-4">No listings match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-sm font-medium text-[#FF7A00] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center">
              {isAuthenticated ? (
                <>
                  <p className="text-white/90 mb-2 font-medium">No listings yet.</p>
                  <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                    Data is stored in <strong className="text-white">MongoDB</strong> (shared for all users).
                    If a seller just published, wait a few seconds or click Refresh.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      disabled={loadingSample}
                      onClick={() => void handleLoadSampleListings()}
                      className="inline-block px-8 py-4 bg-[#FF7A00] text-white rounded-full font-medium hover:bg-[#E66E00] transition-colors disabled:opacity-50"
                    >
                      {loadingSample ? 'Loading…' : 'Load sample listings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => reloadListings({ force: true })}
                      className="inline-block px-8 py-4 border border-white/20 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                  {sampleError && (
                    <p className="mt-4 text-sm text-red-400">{sampleError}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white/80 mb-2">Published listings will appear here for everyone to browse.</p>
                  <p className="text-white/60 text-sm mb-6">
                    Sellers must click <strong className="text-white/90">Publish listing</strong> on the last step of the listing wizard.
                  </p>
                  <Link
                    to="/list-your-property"
                    className="inline-block px-8 py-4 bg-[#FF7A00] text-white rounded-full font-medium hover:bg-[#E66E00] transition-colors"
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
