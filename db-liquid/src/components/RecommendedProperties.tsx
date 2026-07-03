import { useListings } from '../context/ListingsContext';
import { PropertyListingCard } from './PropertyListingCard';

export function RecommendedProperties() {
  const { listings } = useListings();
  const recommended = listings.slice(0, 4); // Show top 4 listings

  if (recommended.length === 0) return null;

  return (
    <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-0">
      <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Plots/Land in <span className="text-[#FF7A00]">Noida</span></h2>
        <p className="text-white/70">Properties in and around the city</p>
      </div>
      
      <div className="flex items-center gap-3 mb-8 overflow-x-auto hide-scrollbar">
        <button className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium whitespace-nowrap">Residential Buy</button>
        <button className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium whitespace-nowrap">Commercial Buy</button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Plots/Land Collections and more...</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommended.map((listing) => (
          <PropertyListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
