export const PROPERTY_TYPES = [
  {
    category: 'ALL RESIDENTIAL',
    options: [
      'Flat/ Apartment',
      'Residential House',
      'Villa',
      'Builder Floor Apartment',
      'Residential Land/ Plot',
      'Penthouse',
      'Studio Apartment',
    ],
  },
  {
    category: 'ALL COMMERCIAL',
    options: [
      'Commercial Office Space',
      'Office in IT Park/ SEZ',
      'Commercial Shop',
      'Commercial Showroom',
    ],
  },
  {
    category: 'ALL INDUSTRIAL',
    options: [
      'Commercial Land',
      'Warehouse/ Godown',
      'Industrial Land',
      'Industrial Building',
      'Industrial Shed',
    ],
  },
  {
    category: 'ALL AGRICULTURAL',
    options: ['Agricultural Land', 'Farm House'],
  },
] as const;

const PLOT_TYPES = [
  'Residential Land/ Plot',
  'Commercial Land',
  'Industrial Land',
  'Agricultural Land',
] as const;

const RESIDENTIAL_UNIT_TYPES = [
  'Flat/ Apartment',
  'Residential House',
  'Villa',
  'Builder Floor Apartment',
  'Penthouse',
  'Studio Apartment',
  'Farm House',
] as const;

export function isPlotType(type: string) {
  return (PLOT_TYPES as readonly string[]).includes(type);
}

export function isResidentialUnitType(type: string) {
  return (RESIDENTIAL_UNIT_TYPES as readonly string[]).includes(type);
}

export function isVillaType(type: string) {
  return type === 'Villa';}

export function isBuilderFloorType(type: string) {
  return type === 'Builder Floor Apartment';}

export function isPenthouseType(type: string) {
  return type === 'Penthouse';
}

export function isCommercialShopType(type: string) {
  return type === 'Commercial Shop' || type === 'Commercial Showroom';
}

export function isCommercialShowroomType(type: string) {
  return type === 'Commercial Showroom';
}

export function isCommercialOfficeType(type: string) {
  return type === 'Commercial Office Space' || type === 'Office in IT Park/ SEZ';
}

export function isWarehouseGodownType(type: string) {
  return type === 'Warehouse/ Godown';
}

export function isIndustrialLandType(type: string) {
  return type === 'Industrial Land';
}

export function isIndustrialBuildingType(type: string) {
  return type === 'Industrial Building';
}

export function isIndustrialShedType(type: string) {
  return type === 'Industrial Shed';
}

export function isAgriculturalLandType(type: string) {
  return type === 'Agricultural Land';
}

export function isFarmHouseType(type: string) {
  return type === 'Farm House';
}

/** Shop, showroom, and office — shared commercial unit details form. */
export function isCommercialUnitType(type: string) {
  return isCommercialShopType(type) || isCommercialOfficeType(type);
}

export const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'] as const;

export const BHK_DEFAULTS: Record<
  (typeof BHK_OPTIONS)[number],
  { bedrooms: number; washrooms: number; balconies: number; kitchens: number }
> = {
  '1 BHK': { bedrooms: 1, washrooms: 1, balconies: 1, kitchens: 1 },
  '2 BHK': { bedrooms: 2, washrooms: 2, balconies: 1, kitchens: 1 },
  '3 BHK': { bedrooms: 3, washrooms: 2, balconies: 2, kitchens: 1 },
  '4 BHK': { bedrooms: 4, washrooms: 3, balconies: 2, kitchens: 1 },
  '5+ BHK': { bedrooms: 5, washrooms: 4, balconies: 3, kitchens: 2 },
};
