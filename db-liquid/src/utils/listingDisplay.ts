import type { ListingVerifications, PropertyListing, VerificationDocument } from '../types/listing';
import { getBidTotal, getHighestBidPerSqFt, getRecommendedBid } from '../types/listing';
import { isPlotType } from '../data/propertyTypes';

const STATE_HINTS: Record<string, string> = {
  noida: 'Uttar Pradesh',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  delhi: 'Delhi',
  mumbai: 'Maharashtra',
  bangalore: 'Karnataka',
  bengaluru: 'Karnataka',
  pune: 'Maharashtra',
  hyderabad: 'Telangana',
  chennai: 'Tamil Nadu',
  jaipur: 'Rajasthan',
};

export function getDisplayListingId(id: string) {
  const short = id.replace(/-/g, '').slice(0, 5).toUpperCase();
  return `DBL-${short}`;
}

export function parseListingLocation(location: string) {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  const city = parts[0] || location || '—';
  const state =
    parts[1] ||
    STATE_HINTS[city.toLowerCase()] ||
    STATE_HINTS[city.toLowerCase().replace(/^g-/, '')] ||
    'India';
  return { city, state };
}

export function getListingCityState(listing: PropertyListing) {
  if (listing.locality) {
    return {
      city: listing.locality,
      state: listing.state || parseListingLocation(listing.location).state,
    };
  }
  return parseListingLocation(listing.location);
}

export function buildListingLocation(locality: string, state: string) {
  return `${locality.trim()}, ${state.trim()}`;
}

export function formatListingFloor(floor?: string, totalFloors?: string) {
  if (!floor?.trim()) return '';
  if (totalFloors?.trim()) return `Floor ${floor} of ${totalFloors}`;
  return `Floor ${floor}`;
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export function getPropertyDisplayName(listing: PropertyListing) {
  const { city } = getListingCityState(listing);
  const type = listing.propertyType.replace(/\//g, ' ').trim();
  return `${city} ${type}`.replace(/\s+/g, ' ').trim();
}

export function getListedPriceTotal(listing: PropertyListing) {
  return listing.totalPrice;
}

/** Seller expected value — slightly above listed price. */
export function getMarketAskTotal(listing: PropertyListing) {
  const premium = Math.round(listing.totalPrice * 0.045);
  return listing.totalPrice + Math.max(premium, 50000);
}

export function getCurrentHighestBidTotal(listing: PropertyListing) {
  return getBidTotal(getHighestBidPerSqFt(listing), listing.areaSqFt);
}

export function getRecommendedBidTotal(listing: PropertyListing) {
  return getBidTotal(getRecommendedBid(listing), listing.areaSqFt);
}

export function perSqFtFromTotal(total: number, areaSqFt: number) {
  if (!areaSqFt) return 0;
  return Math.ceil(total / areaSqFt);
}

export function getTimeRemainingDetailed(listing: PropertyListing) {
  const diff = new Date(listing.biddingEndsAt).getTime() - Date.now();
  if (diff <= 0) return 'Auction closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const label = days === 1 ? 'Day' : 'Days';
  return `${days} ${label} ${String(hours).padStart(2, '0')} Hours Remaining`;
}

export const VERIFICATION_FIELDS = [
  {
    key: 'titleVerified' as const,
    label: 'Title Verification Completed',
    hint: 'Clear title deed is available',
    documentLabel: 'Title deed / sale deed',
    uploadHint: 'Upload a clear photo or PDF of the title deed',
  },
  {
    key: 'postedByOwner' as const,
    label: 'Posted By Owner',
    hint: 'You are the registered property owner',
    documentLabel: 'Owner ID & proof',
    uploadHint: 'Upload Aadhaar/PAN and ownership proof',
  },
  {
    key: 'bankApproved' as const,
    label: 'Bank Approved',
    hint: 'Property is eligible for a home loan',
    documentLabel: 'Bank NOC / approval',
    uploadHint: 'Upload bank approval or loan eligibility letter',
  },
  {
    key: 'freehold' as const,
    label: 'Freehold Property',
    hint: 'Full ownership rights (not leasehold)',
    documentLabel: 'Freehold certificate',
    uploadHint: 'Upload freehold ownership document',
  },
] as const;

/** @deprecated Use VERIFICATION_FIELDS */
export const VERIFICATION_BADGES = VERIFICATION_FIELDS.map((field) => field.label);

export function getVerificationBadgeLabels(verifications: ListingVerifications) {
  return VERIFICATION_FIELDS.filter((field) => verifications[field.key]).map((field) => field.label);
}

export function getActiveVerificationBadges(listing: PropertyListing) {
  if (listing.verificationDocuments?.length) {
    return VERIFICATION_FIELDS.filter((field) =>
      listing.verificationDocuments!.some((doc) => doc.type === field.key && doc.status === 'approved'),
    ).map((field) => field.label);
  }
  return getVerificationBadgeLabels(listing.verifications);
}

export function getVerificationReviewLabel(status?: PropertyListing['verificationReviewStatus']) {
  if (status === 'pending') return 'Documents under review';
  if (status === 'approved') return 'All documents verified';
  if (status === 'partial') return 'Some documents verified';
  return null;
}

export function buildApprovedVerifications(documents: VerificationDocument[]): ListingVerifications {
  return {
    titleVerified: documents.some((d) => d.type === 'titleVerified' && d.status === 'approved'),
    postedByOwner: documents.some((d) => d.type === 'postedByOwner' && d.status === 'approved'),
    bankApproved: documents.some((d) => d.type === 'bankApproved' && d.status === 'approved'),
    freehold: documents.some((d) => d.type === 'freehold' && d.status === 'approved'),
  };
}

export const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-furnished', 'Fully furnished'] as const;
export const FACING_OPTIONS = [
  'North',
  'South',
  'East',
  'West',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
] as const;
export const POSSESSION_OPTIONS = ['Ready to move', 'Under construction'] as const;

export const LAND_ZONE_OPTIONS = [
  'Commercial',
  'Industrial',
  'Residential',
  'Mixed Use',
  'SEZ',
  'Agricultural',
] as const;

export const COMMERCIAL_SHOP_FLOOR_OPTIONS = [
  'Lower Basement',
  'Upper Basement',
  'Ground',
  '1',
  '2',
  '3',
  '4',
  '5',
  '5+',
] as const;

export const COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS = [
  ...Array.from({ length: 13 }, (_, i) => String(i + 1)),
  '13+',
] as const;

export const COMMERCIAL_SHOP_FURNISHING_OPTIONS = ['Furnished', 'Unfurnished'] as const;

export const COMMERCIAL_SHOP_WASHROOM_OPTIONS = ['0', '1', '2', '3', '3+'] as const;

export const PANTRY_CAFE_OPTIONS = ['Dry', 'Wet', 'Not Available'] as const;

export const PLOT_OPEN_SIDES_OPTIONS = ['1', '2', '3', '4+'] as const;

export type PlotAreaUnit = 'sq-ft' | 'sq-yrd' | 'sq-m';

export const PLOT_AREA_UNIT_OPTIONS: { value: PlotAreaUnit; label: string }[] = [
  { value: 'sq-ft', label: 'Sq-ft' },
  { value: 'sq-yrd', label: 'Sq-yrd' },
  { value: 'sq-m', label: 'Sq-m' },
];

const PLOT_UNIT_TO_SQ_FT: Record<PlotAreaUnit, number> = {
  'sq-ft': 1,
  'sq-yrd': 9,
  'sq-m': 10.76391041671,
};

export function plotUnitLinearLabel(unit: PlotAreaUnit) {
  if (unit === 'sq-yrd') return 'yd';
  if (unit === 'sq-m') return 'm';
  return 'ft';
}

export function convertPlotAreaToSqFt(value: number, unit: PlotAreaUnit) {
  return Math.round(value * PLOT_UNIT_TO_SQ_FT[unit]);
}

export function applyPlotAreaInput(
  unit: PlotAreaUnit,
  plotAreaInput: string,
  plotWidth: string,
  plotLength: string,
): { sqFt: string; areaInUnit: string } | { error: string } {
  const width = Number(plotWidth);
  const length = Number(plotLength);

  if (plotWidth.trim() && plotLength.trim()) {
    if (!Number.isFinite(width) || !Number.isFinite(length) || width <= 0 || length <= 0) {
      return { error: 'Enter valid width and length.' };
    }
    const areaInUnit = width * length;
    return {
      sqFt: String(convertPlotAreaToSqFt(areaInUnit, unit)),
      areaInUnit: String(areaInUnit),
    };
  }

  const area = Number(plotAreaInput);
  if (!plotAreaInput.trim() || !Number.isFinite(area) || area <= 0) {
    return { error: 'Enter plot area or both width and length, then tap Apply.' };
  }

  return {
    sqFt: String(convertPlotAreaToSqFt(area, unit)),
    areaInUnit: plotAreaInput.trim(),
  };
}

type DetailsInput = {
  isPlot: boolean;
  isResidential: boolean;
  bedrooms: number;
  washrooms: number;
  balconies: number;
  kitchens: number;
  hasServiceRoom: boolean;
  hasStudyRoom: boolean;
  builtUpArea: string;
  landSqFt: string;
  plotWidth: string;
  plotLength: string;
  furnishing?: string;
  facing?: string;
  parking?: number;
  possession?: string;
  cornerPlot?: boolean;
  boundaryWall?: boolean;
  plotOpenSides?: string;
  plotRoadWidthMeters?: string;
  plotConstructionDone?: boolean;
  plotGatedColony?: boolean;
  isCommercialShop?: boolean;
  landZone?: string;
  idealForBusinesses?: string;
  shopFloor?: string;
  shopTotalFloors?: string;
  shopWashrooms?: string;
  personalWashroom?: boolean;
  pantryCafeteria?: string;
  cornerShop?: boolean;
  mainRoadFacing?: boolean;
};

export function buildListingDetailsSummary(input: DetailsInput) {
  const {
    isPlot,
    isResidential,
    bedrooms,
    washrooms,
    balconies,
    kitchens,
    hasServiceRoom,
    hasStudyRoom,
    builtUpArea,
    landSqFt,
    plotWidth,
    plotLength,
    furnishing,
    facing,
    parking,
    possession,
    cornerPlot,
    boundaryWall,
    plotOpenSides,
    plotRoadWidthMeters,
    plotConstructionDone,
    plotGatedColony,
    isCommercialShop,
    landZone,
    idealForBusinesses,
    shopFloor,
    shopTotalFloors,
    shopWashrooms,
    personalWashroom,
    pantryCafeteria,
    cornerShop,
    mainRoadFacing,
  } = input;

  let base = isPlot
    ? `${landSqFt} sq.ft (${plotWidth} × ${plotLength} ft)`
    : isResidential
      ? `${bedrooms} bed · ${washrooms} bath · ${balconies} balcony · ${kitchens} kitchen${hasServiceRoom ? ' · Service room' : ''}${hasStudyRoom ? ' · Study room' : ''} · ${builtUpArea} sq.ft`
      : isCommercialShop
        ? `${builtUpArea} sq.ft commercial shop`
        : `${builtUpArea} sq.ft`;

  const extras: string[] = [];
  if (isCommercialShop && landZone) extras.push(landZone);
  if (isCommercialShop && idealForBusinesses) extras.push(`Ideal for ${idealForBusinesses}`);
  if (isCommercialShop && shopFloor) {
    extras.push(
      shopTotalFloors ? `Floor ${shopFloor} of ${shopTotalFloors}` : `Floor ${shopFloor}`,
    );
  }
  if (isCommercialShop && shopWashrooms !== undefined && shopWashrooms !== '') {
    extras.push(`${shopWashrooms} washroom${shopWashrooms === '1' ? '' : 's'}`);
  }
  if (isCommercialShop && personalWashroom) extras.push('Personal washroom');
  if (isCommercialShop && pantryCafeteria) extras.push(`Pantry: ${pantryCafeteria}`);
  if (isCommercialShop && cornerShop) extras.push('Corner shop');
  if (isCommercialShop && mainRoadFacing) extras.push('Main road facing');
  if (furnishing) extras.push(furnishing);
  if (facing) extras.push(`${facing} facing`);
  if (parking && parking > 0) extras.push(`${parking} parking`);
  if (possession) extras.push(possession);
  if (isPlot && cornerPlot) extras.push('Corner plot');
  if (isPlot && boundaryWall) extras.push('Boundary wall');
  if (isPlot && plotOpenSides) extras.push(`${plotOpenSides} open side${plotOpenSides === '1' ? '' : 's'}`);
  if (isPlot && plotRoadWidthMeters) extras.push(`${plotRoadWidthMeters} m road`);
  if (isPlot && plotConstructionDone) extras.push('Construction done');
  if (isPlot && plotGatedColony) extras.push('Gated colony');

  if (extras.length > 0) {
    base = `${base} · ${extras.join(' · ')}`;
  }

  return base;
}

/** Short buyer-facing label, e.g. "2 BHK · 2000 sq.ft" instead of full room breakdown. */
export function formatBuyerConfiguration(listing: PropertyListing) {
  const summary = listing.detailsSummary;
  const areaLabel =
    listing.areaSqFt > 0 ? `${listing.areaSqFt.toLocaleString('en-IN')} sq.ft` : '';

  if (listing.propertyType.toLowerCase().includes('studio')) {
    return areaLabel ? `Studio · ${areaLabel}` : 'Studio';
  }

  const bedMatch = summary.match(/(\d+)\s*bed/i);
  if (bedMatch) {
    const beds = Number(bedMatch[1]);
    let bhk = beds >= 5 ? '5+ BHK' : `${beds} BHK`;

    const extras: string[] = [];
    if (/study room/i.test(summary)) extras.push('Study');
    if (/service room/i.test(summary)) extras.push('Service');

    if (extras.length > 0) {
      bhk = `${bhk} + ${extras.join(' + ')}`;
    }

    return areaLabel ? `${bhk} · ${areaLabel}` : bhk;
  }

  if (isPlotType(listing.propertyType) || /\d+\s*×\s*\d+\s*ft/i.test(summary)) {
    const plotArea = summary.match(/([\d,]+)\s*sq\.ft/i)?.[1];
    if (plotArea) return `${plotArea} sq.ft plot`;
    return areaLabel ? `${areaLabel} plot` : 'Plot';
  }

  if (listing.propertyType === 'Commercial Shop') {
    return areaLabel ? `Commercial shop · ${areaLabel}` : 'Commercial shop';
  }

  if (areaLabel) return areaLabel;

  return summary || '—';
}
