import type { ReactNode } from 'react';
import type { PropertyListing } from '../../types/listing';
import { formatPrice, formatPriceShort } from '../../types/listing';
import {
  isCommercialUnitType,
  isIndustrialBuildingType,
  isFarmHouseType,
  isIndustrialShedType,
  isPlotType,
  isWarehouseGodownType,
} from '../../data/propertyTypes';
import {
  buildListingFullAddress,
  estimateBookingAmount,
  estimateRegistrationCharges,
  formatListingFloor,
} from '../../utils/listingDisplay';

type DetailRow = {
  label: string;
  value: ReactNode;
};

function DetailRowItem({ label, value }: DetailRow) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 px-4 py-3.5 sm:px-5">
      <dt className="sm:w-40 shrink-0 text-sm text-white/75">{label}</dt>
      <dd className="text-sm font-semibold text-white leading-relaxed min-w-0">{value}</dd>
    </div>
  );
}

function buildDetailRows(listing: PropertyListing): DetailRow[] {
  const rows: DetailRow[] = [];
  const totalPrice = listing.totalPrice;
  const registration = estimateRegistrationCharges(totalPrice);
  const bookingAmount = estimateBookingAmount(totalPrice);
  const isPlot = isPlotType(listing.propertyType);
  const isCommercialUnit = isCommercialUnitType(listing.propertyType);
  const isWarehouse = isWarehouseGodownType(listing.propertyType);
  const isIndustrialBuilding = isIndustrialBuildingType(listing.propertyType);
  const isIndustrialShed = isIndustrialShedType(listing.propertyType);
  const isFarmHouse = isFarmHouseType(listing.propertyType);
  const floorLabel = formatListingFloor(listing.floor, listing.totalFloors);

  rows.push({
    label: 'Price Breakup',
    value: (
      <span className="font-medium">
        <span className="font-semibold text-white">{formatPriceShort(totalPrice)}</span>
        <span className="text-white/30 mx-2">|</span>
        <span>Registration {formatPrice(registration)} Approx.</span>
        <span className="text-white/30 mx-2">|</span>
        <span>{formatPrice(listing.pricePerSqFt)}/sq.ft</span>
      </span>
    ),
  });

  rows.push({
    label: 'Booking Amount',
    value: <span>{formatPrice(bookingAmount)} Approx.</span>,
  });

  rows.push({
    label: 'Address',
    value: buildListingFullAddress(listing),
  });

  if (listing.description?.trim()) {
    rows.push({
      label: 'Landmarks',
      value: listing.description.trim(),
    });
  }

  if (listing.furnishing) {
    rows.push({ label: 'Furnishing', value: listing.furnishing });
  }

  if (listing.facing) {
    rows.push({ label: 'Facing', value: `${listing.facing} facing` });
  }

  if (listing.parking && listing.parking > 0) {
    rows.push({
      label: 'Parking',
      value: `${listing.parking} covered parking`,
    });
  }

  if (listing.possession) {
    rows.push({ label: 'Possession', value: listing.possession });
  }
  if (listing.possession === 'Under Construction') {
    if (listing.availableFromMonth || listing.availableFromYear) {
      rows.push({
        label: 'Available From',
        value: [listing.availableFromMonth, listing.availableFromYear].filter(Boolean).join(' '),
      });
    }
  }
  if (listing.possession === 'Ready to Move' && listing.ageOfConstruction) {
    rows.push({ label: 'Age of Construction', value: listing.ageOfConstruction });
  }
  if (listing.bookingTokenAmount != null && listing.bookingTokenAmount > 0) {
    rows.push({
      label: 'Booking / Token',
      value: `₹${listing.bookingTokenAmount.toLocaleString('en-IN')}`,
    });
  }
  if (listing.priceNegotiable) {
    rows.push({ label: 'Price Negotiable', value: 'Yes' });
  }

  if (floorLabel) {
    rows.push({ label: 'Floor', value: floorLabel });
  }

  if (listing.projectName) {
    rows.push({ label: 'Project / Society', value: listing.projectName });
  }
  if (listing.carpetArea != null && listing.carpetArea > 0) {
    rows.push({
      label: 'Carpet Area',
      value: `${listing.carpetArea.toLocaleString('en-IN')} sq.ft`,
    });
  }
  if (listing.superArea != null && listing.superArea > 0) {
    rows.push({
      label: 'Super Area',
      value: `${listing.superArea.toLocaleString('en-IN')} sq.ft`,
    });
  }
  if (listing.privateTerrace) {
    rows.push({ label: 'Private Terrace', value: 'Yes' });
  }
  if (listing.currentlyLeasedOut === true) {
    rows.push({ label: 'Currently Leased Out', value: 'Yes' });
  } else if (listing.currentlyLeasedOut === false) {
    rows.push({ label: 'Currently Leased Out', value: 'No' });
  }
  if (listing.maintenanceCharges != null && listing.maintenanceCharges > 0) {
    rows.push({
      label: 'Maintenance',
      value: `₹${listing.maintenanceCharges.toLocaleString('en-IN')} / month`,
    });
  }

  if (isPlot) {
    if (listing.propertyNumber) {
      rows.push({ label: 'Property Number', value: listing.propertyNumber });
    }
    if (listing.plotLength != null && listing.plotLength > 0) {
      rows.push({ label: 'Plot Length', value: `${listing.plotLength}` });
    }
    if (listing.plotWidth != null && listing.plotWidth > 0) {
      rows.push({ label: 'Plot Breadth', value: `${listing.plotWidth}` });
    }
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
    if (listing.cornerPlot) rows.push({ label: 'Corner Plot', value: 'Yes' });
    if (listing.boundaryWall === true) rows.push({ label: 'Boundary Wall', value: 'Yes' });
    else if (listing.boundaryWall === false) rows.push({ label: 'Boundary Wall', value: 'No' });
    if (listing.plotOpenSides) {
      rows.push({
        label: 'Open Sides',
        value: `${listing.plotOpenSides} side${listing.plotOpenSides === '1' ? '' : 's'}`,
      });
    }
    if (listing.plotRoadWidthMeters) {
      rows.push({
        label: 'Width of facing road',
        value: `${listing.plotRoadWidthMeters} metres`,
      });
    }
    if (listing.plotConstructionDone) {
      rows.push({ label: 'Construction Done', value: 'Yes' });
    }
    if (listing.plotGatedColony) {
      rows.push({ label: 'In a gated colony', value: 'Yes' });
    }
    if (listing.landZone) {
      rows.push({ label: 'Land Zone', value: listing.landZone });
    }
  }

  if (listing.propertyType === 'Villa') {
    if (listing.plotAreaSqFt != null && listing.plotAreaSqFt > 0) {
      rows.push({
        label: 'Plot Area',
        value: `${listing.plotAreaSqFt.toLocaleString('en-IN')} sq.ft`,
      });
    }
    if (listing.cornerPlot) rows.push({ label: 'Corner Plot', value: 'Yes' });
    if (listing.plotOpenSides) {
      rows.push({
        label: 'Open Sides',
        value: `${listing.plotOpenSides} side${listing.plotOpenSides === '1' ? '' : 's'}`,
      });
    }
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
  }

  if (listing.propertyType === 'Builder Floor Apartment') {
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
  }

  if (isWarehouse) {
    if (listing.landZone) rows.push({ label: 'Land Zone', value: listing.landZone });
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
    if (listing.plotOpenSides) {
      rows.push({
        label: 'Open Sides',
        value: `${listing.plotOpenSides} side${listing.plotOpenSides === '1' ? '' : 's'}`,
      });
    }
    if (listing.plotRoadWidthMeters) {
      rows.push({
        label: 'Width of facing road',
        value: `${listing.plotRoadWidthMeters} metres`,
      });
    }
  }

  if (isIndustrialBuilding) {
    if (listing.landZone) rows.push({ label: 'Land Zone', value: listing.landZone });
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
  }

  if (isIndustrialShed) {
    if (listing.landZone) rows.push({ label: 'Land Zone', value: listing.landZone });
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
    if (listing.plotOpenSides) {
      rows.push({
        label: 'Open Sides',
        value: `${listing.plotOpenSides} side${listing.plotOpenSides === '1' ? '' : 's'}`,
      });
    }
  }

  if (isFarmHouse) {
    if (listing.floorsAllowed) {
      rows.push({ label: 'Floors Allowed', value: listing.floorsAllowed });
    }
    if (listing.plotOpenSides) {
      rows.push({
        label: 'Open Sides',
        value: `${listing.plotOpenSides} side${listing.plotOpenSides === '1' ? '' : 's'}`,
      });
    }
    if (listing.plotRoadWidthMeters) {
      rows.push({
        label: 'Width of facing road',
        value: `${listing.plotRoadWidthMeters} metres`,
      });
    }
  }

  if (isCommercialUnit) {
    if (listing.landZone) rows.push({ label: 'Land Zone', value: listing.landZone });
    if (listing.floorsOffered) {
      rows.push({ label: 'Floor(s) Offered', value: listing.floorsOffered });
    }
    if (listing.plotAreaSqFt != null && listing.plotAreaSqFt > 0) {
      rows.push({
        label: 'Plot Area',
        value: `${listing.plotAreaSqFt.toLocaleString('en-IN')} sq.ft`,
      });
    }
    if (listing.entranceWidthFeet != null && listing.entranceWidthFeet > 0) {
      rows.push({
        label: 'Entrance Width',
        value: `${listing.entranceWidthFeet} ft`,
      });
    }
    if (listing.assetStatus) rows.push({ label: 'Asset Status', value: listing.assetStatus });
    if (listing.paymentComplete) rows.push({ label: 'Payment', value: 'Complete' });
    if (listing.paymentRemaining) {
      rows.push({
        label: 'Payment Remaining',
        value:
          listing.paymentRemainingPercent != null
            ? `${listing.paymentRemainingPercent}%`
            : 'Yes',
      });
    }
    if (listing.assuredReturn) {
      rows.push({
        label: 'Assured Return',
        value:
          listing.assuredReturnPercent != null
            ? `${listing.assuredReturnPercent}%`
            : 'Yes',
      });
    }
    if (listing.leaseGuarantee) {
      rows.push({
        label: 'Lease Guarantee',
        value:
          listing.leaseGuaranteeAmount != null
            ? `₹${listing.leaseGuaranteeAmount.toLocaleString('en-IN')}`
            : 'Yes',
      });
    }
    if (listing.rightsOfUse) rows.push({ label: 'Rights of Use', value: listing.rightsOfUse });
    if (listing.shopType) rows.push({ label: 'Shop Type', value: listing.shopType });
    if (listing.idealForBusinesses) {
      rows.push({ label: 'Ideal for', value: listing.idealForBusinesses });
    }
    if (listing.shopWashrooms) {
      rows.push({
        label: 'Washrooms',
        value: `${listing.shopWashrooms} washroom${listing.shopWashrooms === '1' ? '' : 's'}`,
      });
    }
    if (listing.personalWashroom) {
      rows.push({ label: 'Personal Washroom', value: 'Yes' });
    }
    if (listing.pantryCafeteria) {
      rows.push({ label: 'Pantry / Cafeteria', value: listing.pantryCafeteria });
    }
    if (listing.cornerShop) rows.push({ label: 'Corner Unit', value: 'Yes' });
    if (listing.mainRoadFacing) {
      rows.push({ label: 'Main Road Facing', value: 'Yes' });
    }
  }

  return rows;
}

type Props = {
  listing: PropertyListing;
};

export function PropertyMoreDetails({ listing }: Props) {
  const rows = buildDetailRows(listing);

  return (
    <section className="w-full glass-card rounded-[18px] p-5 lg:p-6">
      <h2 className="text-lg lg:text-xl font-bold text-white mb-4">More Details</h2>
      <div className="glass-card-inner rounded-xl divide-y divide-white/10 overflow-hidden">
        <dl>
          {rows.map((row) => (
            <DetailRowItem key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
      </div>
    </section>
  );
}
