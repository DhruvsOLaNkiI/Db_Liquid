import {
  isPlotType,
  isResidentialUnitType,
  isCommercialUnitType,
  isVillaType,
  isBuilderFloorType,
  isPenthouseType,
  isCommercialShowroomType,
} from '../data/propertyTypes';
import type { PropertyListing, PropertyPhoto, PropertyVideo } from '../types/listing';
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
  propertyNumber: string;
  plotWidth: string;
  plotLength: string;
  floorsAllowed: string;
  projectName: string;
  carpetArea: string;
  superArea: string;
  maintenanceCharges: string;
  furnishing: string;
  facing: string;
  parking: number;
  possession: string;
  availableFromMonth: string;
  availableFromYear: string;
  ageOfConstruction: string;
  bookingTokenAmount: string;
  priceNegotiable: boolean;
  cornerPlot: boolean;
  boundaryWall: boolean | undefined;
  plotOpenSides: string;
  plotRoadWidthMeters: string;
  plotConstructionDone: boolean | undefined;
  plotGatedColony: boolean | undefined;
  landZone: string;
  privateTerrace: boolean;
  currentlyLeasedOut: boolean | undefined;
  entranceWidthFeet: string;
  floorsOffered: string;
  assetStatus: string;
  paymentComplete: boolean;
  paymentRemaining: boolean;
  paymentRemainingPercent: string;
  assuredReturn: boolean;
  assuredReturnPercent: string;
  leaseGuarantee: boolean;
  leaseGuaranteeAmount: string;
  rightsOfUse: string;
  shopType: string;
  idealForBusinesses: string;
  shopWashrooms: string;
  cornerShop: boolean | undefined;
  mainRoadFacing: boolean | undefined;
  personalWashroom: boolean | undefined;
  pantryCafeteria: string;
  propertyHighlights: string;
  photoNote: string;
  propertyPhotos: PropertyPhoto[];
  propertyVideos: PropertyVideo[];
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
      : listing.plotAreaSqFt != null
        ? String(listing.plotAreaSqFt)
        : '',
    propertyNumber: listing.propertyNumber || '',
    plotWidth: listing.plotWidth != null ? String(listing.plotWidth) : '',
    plotLength: listing.plotLength != null ? String(listing.plotLength) : '',
    floorsAllowed: listing.floorsAllowed || '',
    projectName: listing.projectName || '',
    carpetArea: listing.carpetArea != null ? String(listing.carpetArea) : '',
    superArea: listing.superArea != null ? String(listing.superArea) : '',
    maintenanceCharges:
      listing.maintenanceCharges != null ? String(listing.maintenanceCharges) : '',
    furnishing: listing.furnishing || '',
    facing: listing.facing || '',
    parking: listing.parking ?? 1,
    possession:
      listing.possession ||
      (listing.assetStatus === 'Ready to Move In'
        ? 'Ready to Move'
        : listing.assetStatus === 'Under Construction'
          ? 'Under Construction'
          : ''),
    availableFromMonth: listing.availableFromMonth || '',
    availableFromYear: listing.availableFromYear || '',
    ageOfConstruction: listing.ageOfConstruction || '',
    bookingTokenAmount:
      listing.bookingTokenAmount != null ? String(listing.bookingTokenAmount) : '',
    priceNegotiable: listing.priceNegotiable === true,
    cornerPlot: listing.cornerPlot ?? false,
    boundaryWall: listing.boundaryWall,
    plotOpenSides: listing.plotOpenSides || '',
    plotRoadWidthMeters: listing.plotRoadWidthMeters
      ? String(listing.plotRoadWidthMeters)
      : '',
    plotConstructionDone: listing.plotConstructionDone,
    plotGatedColony: listing.plotGatedColony,
    landZone: listing.landZone || '',
    privateTerrace: listing.privateTerrace === true,
    currentlyLeasedOut: listing.currentlyLeasedOut,
    entranceWidthFeet:
      listing.entranceWidthFeet != null ? String(listing.entranceWidthFeet) : '',
    floorsOffered: listing.floorsOffered || '',
    assetStatus: listing.assetStatus || '',
    paymentComplete: listing.paymentComplete === true,
    paymentRemaining: listing.paymentRemaining === true,
    paymentRemainingPercent:
      listing.paymentRemainingPercent != null ? String(listing.paymentRemainingPercent) : '',
    assuredReturn: listing.assuredReturn === true,
    assuredReturnPercent:
      listing.assuredReturnPercent != null ? String(listing.assuredReturnPercent) : '',
    leaseGuarantee: listing.leaseGuarantee === true,
    leaseGuaranteeAmount:
      listing.leaseGuaranteeAmount != null ? String(listing.leaseGuaranteeAmount) : '',
    rightsOfUse: listing.rightsOfUse || '',
    shopType: listing.shopType || '',
    idealForBusinesses: listing.idealForBusinesses || '',
    shopWashrooms: listing.shopWashrooms || '',
    cornerShop: listing.cornerShop,
    mainRoadFacing: listing.mainRoadFacing,
    personalWashroom: listing.personalWashroom,
    pantryCafeteria: listing.pantryCafeteria || '',
    propertyHighlights: listing.description || '',
    photoNote: '',
    propertyPhotos: listing.propertyPhotos ?? [],
    propertyVideos: listing.propertyVideos ?? [],
    pricePerSqFt: String(listing.pricePerSqFt || ''),
  };
}

export function editFormToListingPatch(listing: PropertyListing, form: ListingEditFormState) {
  const isPlot = isPlotType(listing.propertyType);
  const isResidential = isResidentialUnitType(listing.propertyType);
  const isCommercialUnit = isCommercialUnitType(listing.propertyType);
  const isVilla = isVillaType(listing.propertyType);
  const isBuilderFloor = isBuilderFloorType(listing.propertyType);
  const isPenthouse = isPenthouseType(listing.propertyType);
  const isCommercialShowroom = isCommercialShowroomType(listing.propertyType);
  const showFloorFields = !isPlot && !isCommercialUnit && !isBuilderFloor && !isPenthouse;

  const location = buildListingLocation(form.locality, form.stateName);
  const areaSqFt = isPlot
    ? Number(form.landSqFt) || listing.areaSqFt
    : Number(form.builtUpArea) || listing.areaSqFt;
  const pricePerSqFt = Math.round(Number(form.pricePerSqFt));
  const totalPrice = pricePerSqFt * areaSqFt;

  const detailsSummary = buildListingDetailsSummary({
    isPlot,
    isResidential,
    isCommercialUnit,
    bedrooms: form.bedrooms,
    washrooms: form.washrooms,
    balconies: form.balconies,
    kitchens: form.kitchens,
    hasServiceRoom: form.hasServiceRoom,
    hasStudyRoom: form.hasStudyRoom,
    builtUpArea: form.builtUpArea,
    landSqFt: form.landSqFt,
    propertyNumber: form.propertyNumber || undefined,
    floorsAllowed: form.floorsAllowed || undefined,
    projectName: form.projectName || undefined,
    carpetArea: form.carpetArea || undefined,
    superArea: form.superArea || undefined,
    privateTerrace: isPenthouse ? form.privateTerrace : undefined,
    currentlyLeasedOut: isCommercialShowroom ? form.currentlyLeasedOut : undefined,
    entranceWidthFeet: form.entranceWidthFeet || undefined,
    floorsOffered: form.floorsOffered || undefined,
    maintenanceCharges: form.maintenanceCharges || undefined,
    furnishing: form.furnishing || undefined,
    facing: form.facing || undefined,
    parking: form.parking || undefined,
    possession: form.possession || undefined,
    availableFromMonth: form.availableFromMonth || undefined,
    availableFromYear: form.availableFromYear || undefined,
    ageOfConstruction: form.ageOfConstruction || undefined,
    bookingTokenAmount: form.bookingTokenAmount || undefined,
    priceNegotiable: form.priceNegotiable,
    cornerPlot: form.cornerPlot,
    boundaryWall: form.boundaryWall === true,
    plotOpenSides: form.plotOpenSides || undefined,
    plotRoadWidthMeters: form.plotRoadWidthMeters || undefined,
    plotConstructionDone: form.plotConstructionDone,
    plotGatedColony: form.plotGatedColony,
    landZone: form.landZone || undefined,
    assetStatus: form.assetStatus || undefined,
    paymentComplete: form.paymentComplete,
    paymentRemaining: form.paymentRemaining,
    paymentRemainingPercent: form.paymentRemainingPercent || undefined,
    assuredReturn: form.assuredReturn,
    assuredReturnPercent: form.assuredReturnPercent || undefined,
    leaseGuarantee: form.leaseGuarantee,
    leaseGuaranteeAmount: form.leaseGuaranteeAmount || undefined,
    rightsOfUse: form.rightsOfUse || undefined,
    shopType: form.shopType || undefined,
    idealForBusinesses: form.idealForBusinesses || undefined,
    shopFloor: isCommercialUnit ? form.floor || undefined : undefined,
    shopTotalFloors: isCommercialUnit ? form.totalFloors || undefined : undefined,
    shopWashrooms: isCommercialUnit ? form.shopWashrooms || undefined : undefined,
    personalWashroom: isCommercialUnit ? form.personalWashroom : undefined,
    pantryCafeteria: isCommercialUnit ? form.pantryCafeteria || undefined : undefined,
    cornerShop: isCommercialUnit ? form.cornerShop : undefined,
    mainRoadFacing: isCommercialUnit ? form.mainRoadFacing : undefined,
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
    floor:
      (showFloorFields || isCommercialUnit || isBuilderFloor || isPenthouse) &&
      form.floor.trim()
        ? form.floor.trim()
        : undefined,
    totalFloors:
      (showFloorFields || isCommercialUnit || isBuilderFloor || isPenthouse) &&
      form.totalFloors.trim()
        ? form.totalFloors.trim()
        : undefined,
    areaSqFt,
    detailsSummary,
    description,
    propertyPhotos: form.propertyPhotos,
    propertyVideos: form.propertyVideos,
    furnishing: form.furnishing || undefined,
    facing: form.facing || undefined,
    parking: form.parking || undefined,
    possession: form.possession || undefined,
    availableFromMonth:
      form.possession === 'Under Construction' && form.availableFromMonth
        ? form.availableFromMonth
        : undefined,
    availableFromYear:
      form.possession === 'Under Construction' && form.availableFromYear
        ? form.availableFromYear
        : undefined,
    ageOfConstruction:
      form.possession === 'Ready to Move' && form.ageOfConstruction
        ? form.ageOfConstruction
        : undefined,
    bookingTokenAmount:
      form.possession === 'Ready to Move' && form.bookingTokenAmount.trim()
        ? Number(form.bookingTokenAmount)
        : undefined,
    priceNegotiable: form.priceNegotiable,
    cornerPlot: isPlot || isVilla ? form.cornerPlot : undefined,
    boundaryWall: isPlot && form.boundaryWall === true ? true : undefined,
    propertyNumber: isPlot && form.propertyNumber.trim() ? form.propertyNumber.trim() : undefined,
    plotAreaSqFt:
      (isVilla || isCommercialShowroom) && form.landSqFt.trim()
        ? Number(form.landSqFt)
        : undefined,
    currentlyLeasedOut: isCommercialShowroom ? form.currentlyLeasedOut : undefined,
    entranceWidthFeet:
      isCommercialShowroom && form.entranceWidthFeet.trim()
        ? Number(form.entranceWidthFeet)
        : undefined,
    floorsOffered:
      isCommercialShowroom && form.floorsOffered.trim()
        ? form.floorsOffered.trim()
        : undefined,
    floorsAllowed:
      (isVilla || isBuilderFloor) && form.floorsAllowed.trim()
        ? form.floorsAllowed.trim()
        : undefined,
    projectName: !isPlot && form.projectName.trim() ? form.projectName.trim() : undefined,
    carpetArea: !isPlot && form.carpetArea.trim() ? Number(form.carpetArea) : undefined,
    superArea:
      (isBuilderFloor || isPenthouse) && form.superArea.trim()
        ? Number(form.superArea)
        : undefined,
    privateTerrace: isPenthouse ? form.privateTerrace : undefined,
    maintenanceCharges:
      !isPlot && form.maintenanceCharges.trim() ? Number(form.maintenanceCharges) : undefined,
    plotOpenSides: (isPlot || isVilla) && form.plotOpenSides ? form.plotOpenSides : undefined,
    plotRoadWidthMeters:
      isPlot && form.plotRoadWidthMeters.trim() ? Number(form.plotRoadWidthMeters) : undefined,
    plotConstructionDone: isPlot ? form.plotConstructionDone : undefined,
    plotGatedColony: isPlot ? form.plotGatedColony : undefined,
    landZone:
      (isPlot || isCommercialUnit) && form.landZone.trim()
        ? form.landZone.trim()
        : undefined,
    assetStatus: isCommercialUnit && form.assetStatus ? form.assetStatus : undefined,
    paymentComplete:
      isCommercialUnit && !isCommercialShowroom && form.paymentComplete ? true : undefined,
    paymentRemaining:
      isCommercialUnit && !isCommercialShowroom && form.paymentRemaining ? true : undefined,
    paymentRemainingPercent:
      isCommercialUnit &&
      !isCommercialShowroom &&
      form.paymentRemaining &&
      form.paymentRemainingPercent.trim()
        ? Number(form.paymentRemainingPercent)
        : undefined,
    assuredReturn: isCommercialUnit && form.assuredReturn ? true : undefined,
    assuredReturnPercent:
      isCommercialUnit && form.assuredReturn && form.assuredReturnPercent.trim()
        ? Number(form.assuredReturnPercent)
        : undefined,
    leaseGuarantee:
      isCommercialUnit && !isCommercialShowroom && form.leaseGuarantee ? true : undefined,
    leaseGuaranteeAmount:
      isCommercialUnit &&
      !isCommercialShowroom &&
      form.leaseGuarantee &&
      form.leaseGuaranteeAmount.trim()
        ? Number(form.leaseGuaranteeAmount)
        : undefined,
    rightsOfUse:
      isCommercialUnit && !isCommercialShowroom && form.rightsOfUse
        ? form.rightsOfUse
        : undefined,
    shopType:
      isCommercialUnit && !isCommercialShowroom && form.shopType ? form.shopType : undefined,
    idealForBusinesses:
      isCommercialUnit && !isCommercialShowroom && form.idealForBusinesses.trim()
        ? form.idealForBusinesses.trim()
        : undefined,
    shopWashrooms: isCommercialUnit && form.shopWashrooms ? form.shopWashrooms : undefined,
    personalWashroom: isCommercialUnit ? form.personalWashroom : undefined,
    pantryCafeteria: isCommercialUnit && form.pantryCafeteria ? form.pantryCafeteria : undefined,
    cornerShop: isCommercialUnit && form.cornerShop === true ? true : undefined,
    mainRoadFacing: isCommercialUnit && form.mainRoadFacing === true ? true : undefined,
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
    if (!form.landSqFt.trim()) {
      return 'Enter plot area and tap Apply.';
    }
  } else if (isCommercialUnitType(listing.propertyType)) {
    const isShowroom = isCommercialShowroomType(listing.propertyType);
    if (!form.builtUpArea.trim()) return 'Enter built-up area.';
    if (!form.floor.trim() || !form.totalFloors.trim()) return 'Select floor details.';
    if (!form.furnishing.trim()) return 'Select furnished status.';
    if (!form.shopWashrooms.trim()) return 'Select number of washrooms.';
    if (isShowroom) {
      if (!form.possession.trim()) return 'Select possession status.';
      if (form.assuredReturn && !form.assuredReturnPercent.trim()) {
        return 'Enter assured return percentage.';
      }
    } else {
      if (!form.assetStatus.trim()) return 'Select asset status.';
      if (!form.rightsOfUse.trim()) return 'Select rights of use.';
      if (!form.shopType.trim()) return 'Select shop type.';
      if (form.paymentRemaining && !form.paymentRemainingPercent.trim()) {
        return 'Enter remaining payment percentage.';
      }
      if (form.assuredReturn && !form.assuredReturnPercent.trim()) {
        return 'Enter assured return percentage.';
      }
      if (form.leaseGuarantee && !form.leaseGuaranteeAmount.trim()) {
        return 'Enter lease guarantee amount.';
      }
    }
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
