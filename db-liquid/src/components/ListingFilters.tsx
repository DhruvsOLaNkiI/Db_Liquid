import { Search, SlidersHorizontal } from 'lucide-react';
import type { PropertyListing } from '../types/listing';
import { getListingStatus } from '../types/listing';

export type ListingStatusFilter = 'all' | 'active' | 'accepted' | 'closed';

type Props = {
  search: string;
  statusFilter: ListingStatusFilter;
  typeFilter: string;
  propertyTypes: string[];
  resultCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ListingStatusFilter) => void;
  onTypeChange: (value: string) => void;
};

const STATUS_OPTIONS: { value: ListingStatusFilter; label: string }[] = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active bid' },
  { value: 'accepted', label: 'On hold' },
  { value: 'closed', label: 'Closed' },
];

export function filterListings(
  listings: PropertyListing[],
  search: string,
  statusFilter: ListingStatusFilter,
  typeFilter: string,
) {
  const query = search.trim().toLowerCase();

  return listings.filter((listing) => {
    if (statusFilter !== 'all' && getListingStatus(listing) !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'all' && listing.propertyType !== typeFilter) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      listing.location,
      listing.locality,
      listing.state,
      listing.propertyType,
      listing.address,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function ListingFilters({
  search,
  statusFilter,
  typeFilter,
  propertyTypes,
  resultCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onTypeChange,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={18} className="text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">Filter listings</h2>
        <span className="text-xs text-gray-400 ml-auto">
          {resultCount} of {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search city, location, type…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as ListingStatusFilter)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
        >
          <option value="all">All property types</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
