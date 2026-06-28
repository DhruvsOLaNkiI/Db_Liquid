import type { PropertyListing } from '../../types/listing';
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
      <dl>
        {rows.map(({ label, value }) => (
          <div key={label} className="py-4 border-b border-[#E5E7EB] last:border-b-0">
            <dt className="text-[15px] font-semibold text-[#0F172A] pb-2 border-b border-[#E5E7EB]">
              {label}
            </dt>
            <dd className="text-[15px] font-medium text-gray-500 mt-2">{value}</dd>
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

function PropertyImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`aspect-[4/3] lg:aspect-auto lg:min-h-[360px] overflow-hidden bg-gray-100 group ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

export function PropertyHeroCard({ listing }: { listing: PropertyListing }) {
  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const imageSrc = listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex];
  const { city, state } = getListingCityState(listing);
  const propertyName = getPropertyDisplayName(listing);
  const floorLabel = formatListingFloor(listing.floor, listing.totalFloors);

  const detailRows: InfoRow[] = [
    { label: 'Listing ID', value: getDisplayListingId(listing.id) },
    { label: 'City', value: city },
    { label: 'State', value: state },
    ...(listing.address ? [{ label: 'Address', value: listing.address }] : []),
    ...(floorLabel ? [{ label: 'Floor', value: floorLabel }] : []),
    ...(listing.pincode ? [{ label: 'Pincode', value: listing.pincode }] : []),
    { label: 'Type', value: listing.propertyType },
    {
      label: 'Configuration',
      value: formatBuyerConfiguration(listing),
    },
  ];

  return (
    <section className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      {/* Mobile: title + vertical detail rows, then image */}
      <div className="lg:hidden">
        <div className="p-5 sm:p-6">
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#0F172A] leading-tight">
            {propertyName}
          </h1>
          <div className="mt-4">
            <PropertyDetailRows rows={detailRows} variant="mobile" />
          </div>
          {listing.description && (
            <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-[#E5E7EB] leading-relaxed">
              {listing.description}
            </p>
          )}
        </div>
        <PropertyImage src={imageSrc} alt={propertyName} />
      </div>

      {/* Desktop: image + details side by side */}
      <div className="hidden lg:grid lg:grid-cols-2">
        <PropertyImage src={imageSrc} alt={propertyName} />
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h1 className="text-[32px] font-bold text-[#0F172A] leading-tight mb-6">{propertyName}</h1>
          <PropertyDetailRows rows={detailRows} variant="desktop" />
          {listing.description && (
            <p className="text-sm text-gray-500 mt-6 leading-relaxed">{listing.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
