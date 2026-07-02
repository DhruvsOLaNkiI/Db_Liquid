import { isPlotType, isResidentialUnitType, isCommercialShopType } from '../data/propertyTypes';
import type { PropertyListing, PropertyPhoto } from '../types/listing';
import { getListingStatus } from '../types/listing';
import {
  buildListingDetailsSummary,
  buildListingLocation,
  getListingCityState,
} from './listingDisplay';

export type ListingEditFormState = {
  locality: string;
  address: string;
  stateName: string;
  pincode: string;
  floor: string;
  totalFloors: string;
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
  furnishing: string;
  facing: string;
  parking: number;
  possession: string;
  cornerPlot: boolean;
  boundaryWall: boolean | undefined;
  plotOpenSides: string;
  plotRoadWidthMeters: string;
  plotConstructionDone: boolean | undefined;
  plotGatedColony: boolean | undefined;
  landZone: string;
  idealForBusinesses: string;
  shopWashrooms: string;
  cornerShop: boolean | undefined;
  mainRoadFacing: boolean | undefined;
  personalWashroom: boolean | undefined;
  pantryCafeteria: string;
  propertyHighlights: string;
  photoNote: string;
  propertyPhotos: PropertyPhoto[];
  pricePerSqFt: string;
};

export function canEditListing(listing: PropertyListing, sellerId: string) {
  return getListingStatus(listing) === 'active' && listing.sellerId === sellerId;
}

export function listingToEditForm(listing: PropertyListing): ListingEditFormState {
  const summary = listing.detailsSummary || '';
  const isPlot = isPlotType(listing.propertyType);

  const bedMatch = summary.match(/(\d+)\s*bed/i);
  const bathMatch = summary.match(/(\d+)\s*bath/i);
  const balconyMatch = summary.match(/(\d+)\s*balcony/i);
  const kitchenMatch = summary.match(/(\d+)\s*kitchen/i);
  const plotDimMatch = summary.match(/\((\d+)\s*×\s*(\d+)\s*ft\)/i);
  const landMatch = summary.match(/([\d,]+)\s*sq\.ft/i);

  const { state: parsedState } = getListingCityState(listing);

  return {
    locality: listing.locality || listing.location.split(',')[0]?.trim() || '',
    address: listing.address || '',
    stateName: listing.state || parsedState || '',
    pincode: listing.pincode || '',
    floor: listing.floor || '',
    totalFloors: listing.totalFloors || '',
    bedrooms: bedMatch ? Number(bedMatch[1]) : 2,
    washrooms: bathMatch ? Number(bathMatch[1]) : 2,
    balconies: balconyMatch ? Number(balconyMatch[1]) : 1,
    kitchens: kitchenMatch ? Number(kitchenMatch[1]) : 1,
    hasServiceRoom: /service room/i.test(summary),
    hasStudyRoom: /study room/i.test(summary),
    builtUpArea: isPlot ? '' : String(listing.areaSqFt || ''),
    landSqFt: isPlot
      ? String(listing.areaSqFt || landMatch?.[1]?.replace(/,/g, '') || '')
      : '',
    plotWidth: plotDimMatch ? plotDimMatch[1] : '',
    plotLength: plotDimMatch ? plotDimMatch[2] : '',
    furnishing: listing.furnishing || '',
    facing: listing.facing || '',
    parking: listing.parking ?? 1,
    possession: listing.possession || '',
    cornerPlot: listing.cornerPlot ?? false,
    boundaryWall: listing.boundaryWall,
    plotOpenSides: listing.plotOpenSides || '',
    plotRoadWidthMeters: listing.plotRoadWidthMeters
      ? String(listing.plotRoadWidthMeters)
      : '',
    plotConstructionDone: listing.plotConstructionDone,
    plotGatedColony: listing.plotGatedColony,
    landZone: listing.landZone || '',
    idealForBusinesses: listing.idealForBusinesses || '',
    shopWashrooms: listing.shopWashrooms || '',
    cornerShop: listing.cornerShop,
    mainRoadFacing: listing.mainRoadFacing,
    personalWashroom: listing.personalWashroom,
    pantryCafeteria: listing.pantryCafeteria || '',
    propertyHighlights: listing.description || '',
    photoNote: '',
    propertyPhotos: listing.propertyPhotos ?? [],
    pricePerSqFt: String(listing.pricePerSqFt || ''),
  };
}

export function editFormToListingPatch(listing: PropertyListing, form: ListingEditFormState) {
  const isPlot = isPlotType(listing.propertyType);
  const isResidential = isResidentialUnitType(listing.propertyType);
  const isCommercialShop = isCommercialShopType(listing.propertyType);
  const showFloorFields = !isPlot && !isCommercialShop;

  const location = buildListingLocation(form.locality, form.stateName);
  const areaSqFt = isPlot
    ? Number(form.landSqFt) || listing.areaSqFt
    : Number(form.builtUpArea) || listing.areaSqFt;
  const pricePerSqFt = Math.round(Number(form.pricePerSqFt));
  const totalPrice = pricePerSqFt * areaSqFt;

  const detailsSummary = buildListingDetailsSummary({
    isPlot,
    isResidential,
    isCommercialShop,
    bedrooms: form.bedrooms,
    washrooms: form.washrooms,
    balconies: form.balconies,
    kitchens: form.kitchens,
    hasServiceRoom: form.hasServiceRoom,
    hasStudyRoom: form.hasStudyRoom,
    builtUpArea: form.builtUpArea,
    landSqFt: form.landSqFt,
    plotWidth: form.plotWidth,
    plotLength: form.plotLength,
    furnishing: form.furnishing || undefined,
    facing: form.facing || undefined,
    parking: form.parking || undefined,
    possession: form.possession || undefined,
    cornerPlot: form.cornerPlot,
    boundaryWall: form.boundaryWall === true,
    plotOpenSides: form.plotOpenSides || undefined,
    plotRoadWidthMeters: form.plotRoadWidthMeters || undefined,
    plotConstructionDone: form.plotConstructionDone,
    plotGatedColony: form.plotGatedColony,
    landZone: form.landZone || undefined,
    idealForBusinesses: form.idealForBusinesses || undefined,
    shopFloor: isCommercialShop ? form.floor || undefined : undefined,
    shopTotalFloors: isCommercialShop ? form.totalFloors || undefined : undefined,
    shopWashrooms: isCommercialShop ? form.shopWashrooms || undefined : undefined,
    personalWashroom: isCommercialShop ? form.personalWashroom : undefined,
    pantryCafeteria: isCommercialShop ? form.pantryCafeteria || undefined : undefined,
    cornerShop: isCommercialShop ? form.cornerShop : undefined,
    mainRoadFacing: isCommercialShop ? form.mainRoadFacing : undefined,
  });

  const description = [form.propertyHighlights.trim(), form.photoNote.trim()]
    .filter(Boolean)
    .join('\n\n');

  return {
    location,
    locality: form.locality.trim(),
    address: form.address.trim(),
    state: form.stateName.trim(),
    pincode: form.pincode.trim() || undefined,
    floor: showFloorFields && form.floor.trim() ? form.floor.trim() : isCommercialShop && form.floor.trim() ? form.floor.trim() : undefined,
    totalFloors:
      showFloorFields && form.totalFloors.trim()
        ? form.totalFloors.trim()
        : isCommercialShop && form.totalFloors.trim()
          ? form.totalFloors.trim()
          : undefined,
    areaSqFt,
    detailsSummary,
    description,
    propertyPhotos: form.propertyPhotos,
    furnishing: form.furnishing || undefined,
    facing: form.facing || undefined,
    parking: form.parking || undefined,
    possession: form.possession || undefined,
    cornerPlot: isPlot ? form.cornerPlot : undefined,
    boundaryWall: isPlot && form.boundaryWall === true ? true : undefined,
    plotOpenSides: isPlot && form.plotOpenSides ? form.plotOpenSides : undefined,
    plotRoadWidthMeters:
      isPlot && form.plotRoadWidthMeters.trim() ? Number(form.plotRoadWidthMeters) : undefined,
    plotConstructionDone: isPlot ? form.plotConstructionDone : undefined,
    plotGatedColony: isPlot ? form.plotGatedColony : undefined,
    landZone: isCommercialShop && form.landZone ? form.landZone : undefined,
    idealForBusinesses:
      isCommercialShop && form.idealForBusinesses.trim() ? form.idealForBusinesses.trim() : undefined,
    shopWashrooms: isCommercialShop && form.shopWashrooms ? form.shopWashrooms : undefined,
    personalWashroom: isCommercialShop ? form.personalWashroom : undefined,
    pantryCafeteria: isCommercialShop && form.pantryCafeteria ? form.pantryCafeteria : undefined,
    cornerShop: isCommercialShop && form.cornerShop === true ? true : undefined,
    mainRoadFacing: isCommercialShop && form.mainRoadFacing === true ? true : undefined,
    pricePerSqFt,
    totalPrice,
  };
}

export function validateEditForm(listing: PropertyListing, form: ListingEditFormState): string | null {
  if (!form.locality.trim() || !form.address.trim() || !form.stateName.trim()) {
    return 'Fill in locality, address, and state.';
  }

  const isPlot = isPlotType(listing.propertyType);
  const isResidential = isResidentialUnitType(listing.propertyType);

  if (isPlot) {
    if (!form.landSqFt.trim() || !form.plotWidth.trim() || !form.plotLength.trim()) {
      return 'Enter plot area and dimensions.';
    }
  } else if (isCommercialShopType(listing.propertyType)) {
    if (!form.builtUpArea.trim()) return 'Enter built-up area.';
    if (!form.landZone.trim()) return 'Select land zone.';
    if (!form.floor.trim() || !form.totalFloors.trim()) return 'Select floor details.';
    if (!form.furnishing.trim()) return 'Select furnished status.';
    if (!form.shopWashrooms.trim()) return 'Select number of washrooms.';
  } else if (isResidential) {
    if (!form.builtUpArea.trim() || form.bedrooms <= 0) {
      return 'Enter bedrooms and built-up area.';
    }
  } else if (!form.builtUpArea.trim()) {
    return 'Enter built-up area.';
  }

  if (!form.pricePerSqFt.trim() || Number(form.pricePerSqFt) <= 0) {
    return 'Enter a valid ask price per sq.ft.';
  }

  return null;
}
