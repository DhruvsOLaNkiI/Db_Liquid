import type { PropertyListing } from '../../types/listing';
import { PropertyImageSlider } from './PropertyImageSlider';
import {
  formatBuyerConfiguration,
  formatListingFloor,
  getDisplayListingId,
  getListingCityState,
  getPropertyDisplayName,
} from '../../utils/listingDisplay';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
];

type InfoRow = { label: string; value: string };

function PropertyDetailRows({
  rows,
  variant,
}: {
  rows: InfoRow[];
  variant: 'mobile' | 'desktop';
}) {
  if (variant === 'mobile') {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        {rows.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm font-semibold text-[#0F172A] mt-0.5 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-[15px] font-medium text-[#0F172A]">{label}</dt>
          <dd className="text-base font-semibold text-gray-500 mt-0.5">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getListingImages(listing: PropertyListing) {
  const uploaded = (listing.propertyPhotos ?? [])
    .map((photo) => photo.dataUrl)
    .filter((url): url is string => Boolean(url));

  if (uploaded.length > 0) return uploaded;

  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  return [PLACEHOLDER_IMAGES[imageIndex]];
}

export function PropertyHeroCard({ listing }: { listing: PropertyListing }) {
  const images = getListingImages(listing);
  const { city, state } = getListingCityState(listing);
  const propertyName = getPropertyDisplayName(listing);
  const floorLabel = formatListingFloor(listing.floor, listing.totalFloors);

  const mobileDetailRows: InfoRow[] = [
    { label: 'Listing ID', value: getDisplayListingId(listing.id) },
    ...(floorLabel ? [{ label: 'Floor', value: floorLabel }] : []),
    { label: 'Configuration', value: formatBuyerConfiguration(listing) },
    ...(listing.pincode ? [{ label: 'Pincode', value: listing.pincode }] : []),
  ];

  const desktopDetailRows: InfoRow[] = [
    { label: 'Listing ID', value: getDisplayListingId(listing.id) },
    { label: 'City', value: city },
    { label: 'State', value: state },
    ...(listing.address ? [{ label: 'Address', value: listing.address }] : []),
    ...(floorLabel ? [{ label: 'Floor', value: floorLabel }] : []),
    ...(listing.pincode ? [{ label: 'Pincode', value: listing.pincode }] : []),
    { label: 'Type', value: listing.propertyType },
    { label: 'Configuration', value: formatBuyerConfiguration(listing) },
  ];

  return (
    <section className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      {/* Mobile: image first, then compact title + details */}
      <div className="lg:hidden">
        <PropertyImageSlider images={images} alt={propertyName} />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{listing.propertyType}</p>
          <h1 className="text-2xl font-bold text-[#0F172A] leading-tight mt-1">{propertyName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {city}
            {state ? `, ${state}` : ''}
          </p>
          <PropertyDetailRows rows={mobileDetailRows} variant="mobile" />
          {listing.description && (
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-[#E5E7EB] leading-relaxed line-clamp-3">
              {listing.description}
            </p>
          )}
        </div>
      </div>

      {/* Desktop: image + details side by side */}
      <div className="hidden lg:grid lg:grid-cols-2">
        <PropertyImageSlider images={images} alt={propertyName} />
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h1 className="text-[32px] font-bold text-[#0F172A] leading-tight mb-6">{propertyName}</h1>
          <PropertyDetailRows rows={desktopDetailRows} variant="desktop" />
          {listing.description && (
            <p className="text-sm text-gray-500 mt-6 leading-relaxed">{listing.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
