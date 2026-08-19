import type { ListingVerifications, PropertyListing, VerificationDocument } from '../types/listing';
import { getBidTotal, getHighestBidTotal, getRecommendedBid, getRecommendedBidTotal as getRecommendedBidTotalFromListing } from '../types/listing';
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

export function getListingViewStats(listing: PropertyListing) {
  return {
    viewCount: listing.viewCount ?? 0,
    uniqueVisitorCount: listing.uniqueVisitorCount ?? 0,
    returnVisitorCount: listing.returnVisitorCount ?? 0,
  };
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
  return getHighestBidTotal(listing);
}

export function getRecommendedBidTotal(listing: PropertyListing) {
  return getRecommendedBidTotalFromListing(listing);
}

export function perSqFtFromTotal(total: number, areaSqFt: number) {
  if (!areaSqFt) return 0;
  return Math.ceil(total / areaSqFt);
}

export function getTimeRemainingDetailed(listing: PropertyListing) {
  if (listing.acceptedBidId) return 'Bid accepted';
  return 'No time limit';
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
export const POSSESSION_OPTIONS = ['Under Construction', 'Ready to Move'] as const;

export const AGE_OF_CONSTRUCTION_OPTIONS = [
  'New Construction',
  'Less than 5 years',
  '5 to 10 years',
  '10 to 15 years',
  '15 to 20 years',
  'Above 20 years',
] as const;

export const AVAILABLE_FROM_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function availableFromYears(fromYear = new Date().getFullYear()) {
  return Array.from({ length: 12 }, (_, i) => String(fromYear + i));
}

export const LAND_ZONE_OPTIONS = [
  'Industrial',
  'Commercial',
  'Residential',
  'Transport and Communication',
  'Public Utilities',
  'Public and Semi Public Use',
  'Open Spaces',
  'Agricultural Zone',
  'Special Economic Zone',
  'Natural Conservation Zone',
  'Government Use',
  'Office in IT Park/SEZ',
] as const;

export const SHOP_ASSET_STATUS_OPTIONS = ['Under Construction', 'Ready to Move In'] as const;

export const SHOP_RIGHTS_OF_USE_OPTIONS = ['Self use', 'By Developer'] as const;

export const SHOP_TYPE_OPTIONS = ['Mall', 'Highstreet', 'Society Shop'] as const;

export const COMMERCIAL_SHOP_FLOOR_LABEL_OPTIONS = [
  'Lower Ground',
  'Upper Ground',
  'Ground',
] as const;

export const COMMERCIAL_SHOWROOM_FLOOR_LABEL_OPTIONS = [
  'Lower Basement',
  'Upper Basement',
  'Ground',
] as const;

export const COMMERCIAL_SHOP_FLOOR_NUMBER_OPTIONS = ['1', '2', '3', '4', '5', '5+'] as const;

export const COMMERCIAL_SHOWROOM_FLOOR_NUMBER_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '6+',
] as const;

export const COMMERCIAL_SHOP_FLOOR_OPTIONS = [
  ...COMMERCIAL_SHOP_FLOOR_LABEL_OPTIONS,
  ...COMMERCIAL_SHOP_FLOOR_NUMBER_OPTIONS,
] as const;

export const COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS = [
  ...Array.from({ length: 13 }, (_, i) => String(i + 1)),
  '13+',
] as const;

export const COMMERCIAL_SHOWROOM_TOTAL_FLOOR_OPTIONS = [
  ...Array.from({ length: 15 }, (_, i) => String(i + 1)),
  '15+',
] as const;

export const COMMERCIAL_SHOWROOM_FLOORS_OFFERED_OPTIONS = [
  'Entire Floor',
  'Partial Floor',
  'Multiple Floors',
] as const;

export const COMMERCIAL_SHOP_FURNISHING_OPTIONS = ['Furnished', 'Unfurnished'] as const;

export const WAREHOUSE_FURNISHING_OPTIONS = [
  'Furnished',
  'Unfurnished',
  'Semi-Furnished',
] as const;

export const WAREHOUSE_FLOOR_OPTIONS = [
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

export const WAREHOUSE_TOTAL_FLOOR_OPTIONS = [
  ...Array.from({ length: 13 }, (_, i) => String(i + 1)),
  '13+',
] as const;

export const WAREHOUSE_FLOORS_ALLOWED_OPTIONS = [
  ...Array.from({ length: 20 }, (_, i) => String(i + 1)),
  '20+',
] as const;

export const COMMERCIAL_SHOP_WASHROOM_OPTIONS = ['0', '1', '2', '3', '3+'] as const;

export const PANTRY_CAFE_OPTIONS = ['Dry', 'Wet', 'Not Available'] as const;

export const PLOT_OPEN_SIDES_OPTIONS = ['1', '2', '3', '4'] as const;

export const FLOORS_ALLOWED_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  'G+1',
  'G+2',
  'G+3',
  'G+4',
] as const;

export const BUILDER_FLOOR_NO_OPTIONS = [
  'Ground',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '10+',
] as const;

export const BUILDER_TOTAL_FLOORS_OPTIONS = [
  ...Array.from({ length: 20 }, (_, i) => String(i + 1)),
  '20+',
] as const;

export const PENTHOUSE_FLOOR_NO_OPTIONS = [
  'Top Floor',
  ...Array.from({ length: 50 }, (_, i) => String(i + 1)),
  '50+',
] as const;

export const PENTHOUSE_TOTAL_FLOORS_OPTIONS = [
  ...Array.from({ length: 60 }, (_, i) => String(i + 1)),
  '60+',
] as const;

export type RoadWidthUnit = 'm' | 'ft';

export const ROAD_WIDTH_UNIT_OPTIONS: { value: RoadWidthUnit; label: string }[] = [
  { value: 'm', label: 'Meters' },
  { value: 'ft', label: 'Feet' },
];

export type PlotAreaUnit = 'sq-ft' | 'sq-yrd' | 'sq-m';

export const PLOT_AREA_UNIT_OPTIONS: { value: PlotAreaUnit; label: string }[] = [
  { value: 'sq-ft', label: 'Sq-ft' },
  { value: 'sq-yrd', label: 'Sq-yrd' },
  { value: 'sq-m', label: 'Sq-m' },
];

/** Villa plot area units — Sq-ft and Sq-Yards only. */
export const VILLA_PLOT_AREA_UNIT_OPTIONS: { value: PlotAreaUnit; label: string }[] = [
  { value: 'sq-ft', label: 'Sq-ft' },
  { value: 'sq-yrd', label: 'Sq-Yards' },
];

export function roadWidthToMeters(value: number, unit: RoadWidthUnit) {
  if (unit === 'ft') return Math.round(value * 0.3048 * 100) / 100;
  return value;
}

export function metersToRoadWidth(meters: number, unit: RoadWidthUnit) {
  if (unit === 'ft') return Math.round((meters / 0.3048) * 100) / 100;
  return meters;
}

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
): { sqFt: string; areaInUnit: string } | { error: string } {
  const area = Number(plotAreaInput);
  if (!plotAreaInput.trim() || !Number.isFinite(area) || area <= 0) {
    return { error: 'Enter plot area, then tap Apply.' };
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
  propertyNumber?: string;
  floorsAllowed?: string;
  projectName?: string;
  carpetArea?: string;
  superArea?: string;
  privateTerrace?: boolean;
  maintenanceCharges?: string;
  furnishing?: string;
  facing?: string;
  parking?: number;
  possession?: string;
  availableFromMonth?: string;
  availableFromYear?: string;
  ageOfConstruction?: string;
  bookingTokenAmount?: string;
  priceNegotiable?: boolean;
  cornerPlot?: boolean;
  boundaryWall?: boolean;
  plotOpenSides?: string;
  plotRoadWidthMeters?: string;
  plotConstructionDone?: boolean;
  plotGatedColony?: boolean;
  isCommercialUnit?: boolean;
  landZone?: string;
  currentlyLeasedOut?: boolean;
  entranceWidthFeet?: string;
  floorsOffered?: string;
  assetStatus?: string;
  paymentComplete?: boolean;
  paymentRemaining?: boolean;
  paymentRemainingPercent?: string;
  assuredReturn?: boolean;
  assuredReturnPercent?: string;
  leaseGuarantee?: boolean;
  leaseGuaranteeAmount?: string;
  rightsOfUse?: string;
  shopType?: string;
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
    propertyNumber,
    floorsAllowed,
    projectName,
    carpetArea,
    superArea,
    privateTerrace,
    currentlyLeasedOut,
    entranceWidthFeet,
    floorsOffered,
    maintenanceCharges,
    furnishing,
    facing,
    parking,
    possession,
    availableFromMonth,
    availableFromYear,
    ageOfConstruction,
    bookingTokenAmount,
    priceNegotiable,
    cornerPlot,
    boundaryWall,
    plotOpenSides,
    plotRoadWidthMeters,
    plotConstructionDone,
    plotGatedColony,
    isCommercialUnit,
    landZone,
    assetStatus,
    paymentComplete,
    paymentRemaining,
    paymentRemainingPercent,
    assuredReturn,
    assuredReturnPercent,
    leaseGuarantee,
    leaseGuaranteeAmount,
    rightsOfUse,
    shopType,
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
    ? propertyNumber?.trim()
      ? `${landSqFt} sq.ft · No. ${propertyNumber.trim()}`
      : `${landSqFt} sq.ft`
    : isResidential
      ? `${bedrooms} bed · ${washrooms} bath · ${balconies} balcony · ${kitchens} kitchen${hasServiceRoom ? ' · Service room' : ''}${hasStudyRoom ? ' · Study room' : ''} · ${builtUpArea} sq.ft`
      : isCommercialUnit
        ? `${builtUpArea} sq.ft commercial unit`
        : `${builtUpArea} sq.ft`;

  const extras: string[] = [];
  if (!isPlot && projectName) extras.push(projectName);
  if (!isPlot && carpetArea) extras.push(`Carpet ${carpetArea} sq.ft`);
  if (!isPlot && superArea) extras.push(`Super ${superArea} sq.ft`);
  if (privateTerrace) extras.push('Private terrace');
  if (currentlyLeasedOut === true) extras.push('Currently leased out');
  if (currentlyLeasedOut === false) extras.push('Not leased out');
  if (floorsOffered) extras.push(floorsOffered);
  if (entranceWidthFeet) extras.push(`Entrance ${entranceWidthFeet} ft`);
  if (!isPlot && maintenanceCharges) extras.push(`Maintenance ₹${maintenanceCharges}`);
  if (isPlot && landZone) extras.push(landZone);
  if (isCommercialUnit && assetStatus) extras.push(assetStatus);
  if (isCommercialUnit && landZone) extras.push(landZone);
  if (isCommercialUnit && shopType) extras.push(shopType);
  if (isCommercialUnit && rightsOfUse) extras.push(rightsOfUse);
  if (isCommercialUnit && paymentComplete) extras.push('Payment complete');
  if (isCommercialUnit && paymentRemaining) {
    extras.push(
      paymentRemainingPercent
        ? `Payment remaining ${paymentRemainingPercent}%`
        : 'Payment remaining',
    );
  }
  if (isCommercialUnit && assuredReturn) {
    extras.push(
      assuredReturnPercent
        ? `Assured return ${assuredReturnPercent}%`
        : 'Assured return',
    );
  }
  if (isCommercialUnit && leaseGuarantee) {
    extras.push(
      leaseGuaranteeAmount
        ? `Lease guarantee ₹${leaseGuaranteeAmount}`
        : 'Lease guarantee',
    );
  }
  if (isCommercialUnit && idealForBusinesses) extras.push(`Ideal for ${idealForBusinesses}`);
  if (isCommercialUnit && shopFloor) {
    extras.push(
      shopTotalFloors ? `Floor ${shopFloor} of ${shopTotalFloors}` : `Floor ${shopFloor}`,
    );
  }
  if (isCommercialUnit && shopWashrooms !== undefined && shopWashrooms !== '') {
    extras.push(`${shopWashrooms} washroom${shopWashrooms === '1' ? '' : 's'}`);
  }
  if (isCommercialUnit && personalWashroom) extras.push('Personal washroom');
  if (isCommercialUnit && pantryCafeteria) extras.push(`Pantry: ${pantryCafeteria}`);
  if (isCommercialUnit && cornerShop) extras.push('Corner unit');
  if (isCommercialUnit && mainRoadFacing) extras.push('Main road facing');
  if (furnishing) extras.push(furnishing);
  if (facing) extras.push(`${facing} facing`);
  if (parking && parking > 0) extras.push(`${parking} parking`);
  if (possession) extras.push(possession);
  if (possession === 'Under Construction' && availableFromMonth && availableFromYear) {
    extras.push(`Available ${availableFromMonth} ${availableFromYear}`);
  }
  if (possession === 'Ready to Move' && ageOfConstruction) extras.push(ageOfConstruction);
  if (bookingTokenAmount) extras.push(`Token ₹${bookingTokenAmount}`);
  if (priceNegotiable) extras.push('Price negotiable');
  if (isPlot && cornerPlot) extras.push('Corner plot');
  if (isPlot && boundaryWall) extras.push('Boundary wall');
  if (isPlot && plotOpenSides) extras.push(`${plotOpenSides} open side${plotOpenSides === '1' ? '' : 's'}`);
  if (isPlot && plotRoadWidthMeters) extras.push(`${plotRoadWidthMeters} m road`);
  if (isPlot && plotConstructionDone) extras.push('Construction done');
  if (isPlot && plotGatedColony) extras.push('Gated colony');
  if (floorsAllowed) extras.push(`${floorsAllowed} floors allowed`);
  if (!isPlot && cornerPlot) extras.push('Corner plot');
  if (!isPlot && plotOpenSides) extras.push(`${plotOpenSides} open side${plotOpenSides === '1' ? '' : 's'}`);
  if (!isPlot && landSqFt) extras.push(`Plot ${landSqFt} sq.ft`);

  if (extras.length > 0) {
    base = `${base} · ${extras.join(' · ')}`;
  }

  return base;
}

/** Short buyer-facing label, e.g. "2 BHK · 2000 sq.ft" instead of full room breakdown. */
export function buildListingFullAddress(listing: PropertyListing) {
  const parts: string[] = [];
  if (listing.address?.trim()) parts.push(listing.address.trim());
  const { city, state } = getListingCityState(listing);
  if (listing.locality?.trim()) {
    if (!parts.some((part) => part.toLowerCase().includes(listing.locality!.toLowerCase()))) {
      parts.push(listing.locality.trim());
    }
  } else if (city && city !== '—') {
    parts.push(city);
  }
  if (state && state !== 'India') parts.push(state);
  if (listing.pincode?.trim()) parts.push(listing.pincode.trim());
  return parts.join(', ') || listing.location || '—';
}

export function estimateRegistrationCharges(totalPrice: number) {
  return Math.round(totalPrice * 0.05);
}

export function estimateBookingAmount(totalPrice: number) {
  return Math.round(totalPrice * 0.1);
}

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
