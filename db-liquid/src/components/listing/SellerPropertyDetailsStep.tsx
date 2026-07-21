import { useState } from 'react';
import { CommercialShopDetailsSection } from './CommercialShopDetailsSection';
import { FormSelect } from './FormSelect';
import {
  AGE_OF_CONSTRUCTION_OPTIONS,
  applyPlotAreaInput,
  AVAILABLE_FROM_MONTHS,
  availableFromYears,
  BUILDER_FLOOR_NO_OPTIONS,
  BUILDER_TOTAL_FLOORS_OPTIONS,
  FACING_OPTIONS,
  FLOORS_ALLOWED_OPTIONS,
  FURNISHING_OPTIONS,
  PENTHOUSE_FLOOR_NO_OPTIONS,
  PENTHOUSE_TOTAL_FLOORS_OPTIONS,
  PLOT_AREA_UNIT_OPTIONS,
  PLOT_OPEN_SIDES_OPTIONS,
  POSSESSION_OPTIONS,
  VILLA_PLOT_AREA_UNIT_OPTIONS,
  type PlotAreaUnit,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

function CountStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 mb-3 text-center">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          −
        </button>
        <span className="text-xl font-bold w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

/** Use in flex rows with an input — avoid w-full so the select doesn't crush the field. */
const selectInlineClass =
  'shrink-0 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const inputFlexClass =
  'min-w-0 flex-1 px-4 py-4 rounded-2xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

function YesNoChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-5">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={value === true}
            onChange={() => onChange(true)}
            className="w-4 h-4 accent-primary"
          />
          Yes
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={value === false}
            onChange={() => onChange(false)}
            className="w-4 h-4 accent-primary"
          />
          No
        </label>
      </div>
    </div>
  );
}

type Props = {
  isPlot: boolean;
  isResidential: boolean;
  isCommercialUnit: boolean;
  isVilla?: boolean;
  isBuilderFloor?: boolean;
  isPenthouse?: boolean;
  bedrooms: number;
  washrooms: number;
  balconies: number;
  kitchens: number;
  hasServiceRoom: boolean;
  hasStudyRoom: boolean;
  builtUpArea: string;
  landSqFt: string;
  propertyNumber: string;
  floorsAllowed: string;
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
  privateTerrace: boolean;
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
  shopFloor: string;
  shopTotalFloors: string;
  shopWashrooms: string;
  cornerShop: boolean | undefined;
  mainRoadFacing: boolean | undefined;
  personalWashroom: boolean | undefined;
  pantryCafeteria: string;
  propertyHighlights: string;
  onBedroomsChange: (n: number) => void;
  onWashroomsChange: (n: number) => void;
  onBalconiesChange: (n: number) => void;
  onKitchensChange: (n: number) => void;
  onHasServiceRoomChange: (v: boolean) => void;
  onHasStudyRoomChange: (v: boolean) => void;
  onBuiltUpAreaChange: (v: string) => void;
  onLandSqFtChange: (v: string) => void;
  onPropertyNumberChange: (v: string) => void;
  onFloorsAllowedChange: (v: string) => void;
  onCarpetAreaChange: (v: string) => void;
  onSuperAreaChange: (v: string) => void;
  onMaintenanceChargesChange: (v: string) => void;
  onFurnishingChange: (v: string) => void;
  onFacingChange: (v: string) => void;
  onParkingChange: (n: number) => void;
  onPossessionChange: (v: string) => void;
  onAvailableFromMonthChange: (v: string) => void;
  onAvailableFromYearChange: (v: string) => void;
  onAgeOfConstructionChange: (v: string) => void;
  onBookingTokenAmountChange: (v: string) => void;
  onPriceNegotiableChange: (v: boolean) => void;
  onCornerPlotChange: (v: boolean) => void;
  onBoundaryWallChange: (v: boolean) => void;
  onPlotOpenSidesChange: (v: string) => void;
  onPlotRoadWidthMetersChange: (v: string) => void;
  onPlotConstructionDoneChange: (v: boolean) => void;
  onPlotGatedColonyChange: (v: boolean) => void;
  onPrivateTerraceChange: (v: boolean) => void;
  onAssetStatusChange: (v: string) => void;
  onPaymentCompleteChange: (v: boolean) => void;
  onPaymentRemainingChange: (v: boolean) => void;
  onPaymentRemainingPercentChange: (v: string) => void;
  onAssuredReturnChange: (v: boolean) => void;
  onAssuredReturnPercentChange: (v: string) => void;
  onLeaseGuaranteeChange: (v: boolean) => void;
  onLeaseGuaranteeAmountChange: (v: string) => void;
  onRightsOfUseChange: (v: string) => void;
  onShopTypeChange: (v: string) => void;
  onIdealForBusinessesChange: (v: string) => void;
  onShopFloorChange: (v: string) => void;
  onShopTotalFloorsChange: (v: string) => void;
  onShopWashroomsChange: (v: string) => void;
  onCornerShopChange: (v: boolean) => void;
  onMainRoadFacingChange: (v: boolean) => void;
  onPersonalWashroomChange: (v: boolean) => void;
  onPantryCafeteriaChange: (v: string) => void;
  onPropertyHighlightsChange: (v: string) => void;
};

export function SellerPropertyDetailsStep({
  isPlot,
  isResidential,
  isCommercialUnit,
  isVilla = false,
  isBuilderFloor = false,
  isPenthouse = false,
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
  carpetArea,
  superArea,
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
  privateTerrace,
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
  cornerShop,
  mainRoadFacing,
  personalWashroom,
  pantryCafeteria,
  propertyHighlights,
  onBedroomsChange,
  onWashroomsChange,
  onBalconiesChange,
  onKitchensChange,
  onHasServiceRoomChange,
  onHasStudyRoomChange,
  onBuiltUpAreaChange,
  onLandSqFtChange,
  onPropertyNumberChange,
  onFloorsAllowedChange,
  onCarpetAreaChange,
  onSuperAreaChange,
  onMaintenanceChargesChange,
  onFurnishingChange,
  onFacingChange,
  onParkingChange,
  onPossessionChange,
  onAvailableFromMonthChange,
  onAvailableFromYearChange,
  onAgeOfConstructionChange,
  onBookingTokenAmountChange,
  onPriceNegotiableChange,
  onCornerPlotChange,
  onBoundaryWallChange,
  onPlotOpenSidesChange,
  onPlotRoadWidthMetersChange,
  onPlotConstructionDoneChange,
  onPlotGatedColonyChange,
  onPrivateTerraceChange,
  onAssetStatusChange,
  onPaymentCompleteChange,
  onPaymentRemainingChange,
  onPaymentRemainingPercentChange,
  onAssuredReturnChange,
  onAssuredReturnPercentChange,
  onLeaseGuaranteeChange,
  onLeaseGuaranteeAmountChange,
  onRightsOfUseChange,
  onShopTypeChange,
  onIdealForBusinessesChange,
  onShopFloorChange,
  onShopTotalFloorsChange,
  onShopWashroomsChange,
  onCornerShopChange,
  onMainRoadFacingChange,
  onPersonalWashroomChange,
  onPantryCafeteriaChange,
  onPropertyHighlightsChange,
}: Props) {
  const [plotAreaUnit, setPlotAreaUnit] = useState<PlotAreaUnit>('sq-ft');
  const [plotAreaInput, setPlotAreaInput] = useState('');
  const [applyMessage, setApplyMessage] = useState('');

  function handleApplyPlotArea() {
    const result = applyPlotAreaInput(plotAreaUnit, plotAreaInput);
    if ('error' in result) {
      setApplyMessage(result.error);
      return;
    }

    onLandSqFtChange(result.sqFt);
    setApplyMessage(`Applied · ${Number(result.sqFt).toLocaleString('en-IN')} sq.ft saved`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Property details</h1>
        <p className="text-gray-600">
          Add configuration and highlights buyers see on your listing page.
        </p>
      </div>

      {isPlot ? (
        <>
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Property number
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Property / plot number
            </label>
            <input
              type="text"
              value={propertyNumber}
              onChange={(e) => onPropertyNumberChange(e.target.value)}
              placeholder="e.g. Plot 42, A-12"
              className={inputClass}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Plot area</label>
            <div className="flex gap-2 items-stretch">
              <input
                type="number"
                value={plotAreaInput}
                onChange={(e) => {
                  setPlotAreaInput(e.target.value);
                  setApplyMessage('');
                }}
                placeholder="Plot area"
                className={inputFlexClass}
              />
              <select
                value={plotAreaUnit}
                onChange={(e) => {
                  setPlotAreaUnit(e.target.value as PlotAreaUnit);
                  setApplyMessage('');
                }}
                className={`${selectInlineClass} w-[108px]`}
                aria-label="Plot area unit"
              >
                {PLOT_AREA_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleApplyPlotArea}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-blue-950 transition-colors"
            >
              Apply
            </button>
            {landSqFt && (
              <p className="text-sm text-gray-600">
                Land size: <span className="font-semibold text-gray-900">{Number(landSqFt).toLocaleString('en-IN')} sq.ft</span>
              </p>
            )}
          </div>
          {applyMessage && (
            <p className={`text-sm ${applyMessage.startsWith('Applied') ? 'text-green-700' : 'text-amber-700'}`}>
              {applyMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onCornerPlotChange(!cornerPlot)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                cornerPlot
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Corner plot
            </button>
          </div>
        </section>

        <section className="space-y-4 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Property features
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">No. of open sides</label>
            <select
              value={plotOpenSides}
              onChange={(e) => onPlotOpenSidesChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select</option>
              {PLOT_OPEN_SIDES_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Width of road facing the plot
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={plotRoadWidthMeters}
                onChange={(e) => onPlotRoadWidthMetersChange(e.target.value)}
                placeholder="Road width"
                className={`${inputClass} flex-1 min-w-0`}
              />
              <span className="text-sm font-medium text-gray-500 shrink-0 w-14 text-right">Meters</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <YesNoChoice
              label="Any construction done"
              value={plotConstructionDone}
              onChange={onPlotConstructionDoneChange}
            />
            <YesNoChoice
              label="Boundary wall made"
              value={boundaryWall}
              onChange={onBoundaryWallChange}
            />
            <YesNoChoice
              label="Is in a gated colony"
              value={plotGatedColony}
              onChange={onPlotGatedColonyChange}
            />
          </div>
        </section>
        </>
      ) : isCommercialUnit ? (
        <CommercialShopDetailsSection
          builtUpArea={builtUpArea}
          carpetArea={carpetArea}
          maintenanceCharges={maintenanceCharges}
          assetStatus={assetStatus}
          paymentComplete={paymentComplete}
          paymentRemaining={paymentRemaining}
          paymentRemainingPercent={paymentRemainingPercent}
          assuredReturn={assuredReturn}
          assuredReturnPercent={assuredReturnPercent}
          leaseGuarantee={leaseGuarantee}
          leaseGuaranteeAmount={leaseGuaranteeAmount}
          rightsOfUse={rightsOfUse}
          shopType={shopType}
          idealForBusinesses={idealForBusinesses}
          floor={shopFloor}
          totalFloors={shopTotalFloors}
          furnishing={furnishing}
          shopWashrooms={shopWashrooms}
          cornerShop={cornerShop}
          mainRoadFacing={mainRoadFacing}
          personalWashroom={personalWashroom}
          pantryCafeteria={pantryCafeteria}
          onBuiltUpAreaChange={onBuiltUpAreaChange}
          onCarpetAreaChange={onCarpetAreaChange}
          onMaintenanceChargesChange={onMaintenanceChargesChange}
          onAssetStatusChange={onAssetStatusChange}
          onPaymentCompleteChange={onPaymentCompleteChange}
          onPaymentRemainingChange={onPaymentRemainingChange}
          onPaymentRemainingPercentChange={onPaymentRemainingPercentChange}
          onAssuredReturnChange={onAssuredReturnChange}
          onAssuredReturnPercentChange={onAssuredReturnPercentChange}
          onLeaseGuaranteeChange={onLeaseGuaranteeChange}
          onLeaseGuaranteeAmountChange={onLeaseGuaranteeAmountChange}
          onRightsOfUseChange={onRightsOfUseChange}
          onShopTypeChange={onShopTypeChange}
          onIdealForBusinessesChange={onIdealForBusinessesChange}
          onFloorChange={onShopFloorChange}
          onTotalFloorsChange={onShopTotalFloorsChange}
          onFurnishingChange={onFurnishingChange}
          onShopWashroomsChange={onShopWashroomsChange}
          onCornerShopChange={onCornerShopChange}
          onMainRoadFacingChange={onMainRoadFacingChange}
          onPersonalWashroomChange={onPersonalWashroomChange}
          onPantryCafeteriaChange={onPantryCafeteriaChange}
        />
      ) : isResidential ? (
        <>
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Configuration</h2>
          <div className="grid grid-cols-2 gap-3">
            <CountStepper label="Bedrooms" value={bedrooms} onChange={onBedroomsChange} />
            <CountStepper label="Washrooms" value={washrooms} onChange={onWashroomsChange} />
            <CountStepper label="Balconies" value={balconies} onChange={onBalconiesChange} />
            <CountStepper label="Kitchen" value={kitchens} onChange={onKitchensChange} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onHasServiceRoomChange(!hasServiceRoom)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                hasServiceRoom
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              + Service room
            </button>
            <button
              type="button"
              onClick={() => onHasStudyRoomChange(!hasStudyRoom)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                hasStudyRoom
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              + Study room
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Built-up area (sq.ft)</label>
            <input
              type="number"
              value={builtUpArea}
              onChange={(e) => onBuiltUpAreaChange(e.target.value)}
              placeholder="e.g. 1500"
              className={inputClass}
            />
          </div>
          {isBuilderFloor || isPenthouse ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Carpet area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={carpetArea}
                  onChange={(e) => onCarpetAreaChange(e.target.value)}
                  placeholder="e.g. 1200"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Super area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={superArea}
                  onChange={(e) => onSuperAreaChange(e.target.value)}
                  placeholder="e.g. 1400"
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Carpet area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={carpetArea}
                onChange={(e) => onCarpetAreaChange(e.target.value)}
                placeholder="e.g. 1200"
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Maintenance charges <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={maintenanceCharges}
              onChange={(e) => onMaintenanceChargesChange(e.target.value)}
              placeholder="e.g. 3500 / month"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Furnishing</label>
              <select
                value={furnishing}
                onChange={(e) => onFurnishingChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {FURNISHING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Facing</label>
              <select value={facing} onChange={(e) => onFacingChange(e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {FACING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {!isVilla && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Possession</label>
                <select
                  value={possession}
                  onChange={(e) => onPossessionChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select</option>
                  {POSSESSION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Parking slots</label>
              <CountStepper label="Parking" value={parking} onChange={onParkingChange} />
            </div>
          </div>
        </section>

        {isBuilderFloor && (
          <section className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Building &amp; plot details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Floor No.</label>
                <FormSelect
                  value={shopFloor}
                  onChange={onShopFloorChange}
                  options={BUILDER_FLOOR_NO_OPTIONS}
                  className={selectClass}
                  aria-label="Floor number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total floors in building
                </label>
                <FormSelect
                  value={shopTotalFloors}
                  onChange={onShopTotalFloorsChange}
                  options={BUILDER_TOTAL_FLOORS_OPTIONS}
                  className={selectClass}
                  aria-label="Total floors in building"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Floors allowed for construction
              </label>
              <FormSelect
                value={floorsAllowed}
                onChange={onFloorsAllowedChange}
                options={FLOORS_ALLOWED_OPTIONS}
                className={selectClass}
                aria-label="Floors allowed for construction"
              />
            </div>
          </section>
        )}

        {isPenthouse && (
          <section className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Building details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Floor No.</label>
                <FormSelect
                  value={shopFloor}
                  onChange={onShopFloorChange}
                  options={PENTHOUSE_FLOOR_NO_OPTIONS}
                  className={selectClass}
                  aria-label="Floor number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Total floors in building
                </label>
                <FormSelect
                  value={shopTotalFloors}
                  onChange={onShopTotalFloorsChange}
                  options={PENTHOUSE_TOTAL_FLOORS_OPTIONS}
                  className={selectClass}
                  aria-label="Total floors in building"
                />
              </div>
            </div>

            <YesNoChoice
              label="Private terrace"
              value={privateTerrace}
              onChange={onPrivateTerraceChange}
            />
          </section>
        )}

        {isVilla && (
          <section className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Plot details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Plot area</label>
              <div className="flex gap-2 items-stretch">
                <input
                  type="number"
                  value={plotAreaInput}
                  onChange={(e) => {
                    setPlotAreaInput(e.target.value);
                    setApplyMessage('');
                  }}
                  placeholder="Plot area"
                  className={inputFlexClass}
                />
                <select
                  value={plotAreaUnit === 'sq-m' ? 'sq-ft' : plotAreaUnit}
                  onChange={(e) => {
                    setPlotAreaUnit(e.target.value as PlotAreaUnit);
                    setApplyMessage('');
                  }}
                  className={`${selectInlineClass} w-[128px]`}
                  aria-label="Plot area unit"
                >
                  {VILLA_PLOT_AREA_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleApplyPlotArea}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-blue-950 transition-colors"
                >
                  Apply
                </button>
                {landSqFt && (
                  <p className="text-sm text-gray-600">
                    Land size:{' '}
                    <span className="font-semibold text-gray-900">
                      {Number(landSqFt).toLocaleString('en-IN')} sq.ft
                    </span>
                  </p>
                )}
              </div>
              {applyMessage && (
                <p
                  className={`text-sm mt-2 ${
                    applyMessage.startsWith('Applied') ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {applyMessage}
                </p>
              )}
            </div>

            <YesNoChoice
              label="Corner plot"
              value={cornerPlot}
              onChange={onCornerPlotChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Number of open sides
              </label>
              <select
                value={plotOpenSides}
                onChange={(e) => onPlotOpenSidesChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {PLOT_OPEN_SIDES_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Floors allowed for construction
              </label>
              <select
                value={floorsAllowed}
                onChange={(e) => onFloorsAllowedChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {FLOORS_ALLOWED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {isVilla && (
          <section className="space-y-4 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Transaction type, property availability
            </h2>

            <div>
              <p className="block text-sm font-medium text-gray-600 mb-3">Possession status</p>
              <div className="flex flex-wrap gap-6">
                {POSSESSION_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="villa-possession"
                      checked={possession === option}
                      onChange={() => onPossessionChange(option)}
                      className="w-4 h-4 accent-primary"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {possession === 'Under Construction' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Available from</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={availableFromMonth}
                    onChange={(e) => onAvailableFromMonthChange(e.target.value)}
                    className={selectClass}
                    aria-label="Available from month"
                  >
                    <option value="">Month</option>
                    {AVAILABLE_FROM_MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    value={availableFromYear}
                    onChange={(e) => onAvailableFromYearChange(e.target.value)}
                    className={selectClass}
                    aria-label="Available from year"
                  >
                    <option value="">Year</option>
                    {availableFromYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {possession === 'Ready to Move' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Age of construction
                  </label>
                  <select
                    value={ageOfConstruction}
                    onChange={(e) => onAgeOfConstructionChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select</option>
                    {AGE_OF_CONSTRUCTION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Booking / token amount{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={bookingTokenAmount}
                      onChange={(e) => onBookingTokenAmountChange(e.target.value)}
                      placeholder="Booking / token amount"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={priceNegotiable}
                onChange={(e) => onPriceNegotiableChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-primary"
              />
              Price negotiable
            </label>
          </section>
        )}
        </>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Built-up area (sq.ft)</label>
            <input
              type="number"
              value={builtUpArea}
              onChange={(e) => onBuiltUpAreaChange(e.target.value)}
              placeholder="e.g. 2500"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Carpet area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={carpetArea}
              onChange={(e) => onCarpetAreaChange(e.target.value)}
              placeholder="e.g. 2000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Maintenance charges <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={maintenanceCharges}
              onChange={(e) => onMaintenanceChargesChange(e.target.value)}
              placeholder="e.g. 3500 / month"
              className={inputClass}
            />
          </div>
        </section>
      )}

      <section>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Property highlights
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Mention amenities, nearby landmarks, renovation, society name, or anything buyers should know.
        </p>
        <textarea
          value={propertyHighlights}
          onChange={(e) => onPropertyHighlightsChange(e.target.value)}
          rows={4}
          placeholder="e.g. Gated society, 24×7 security, park-facing, recently renovated kitchen…"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
        />
      </section>
    </div>
  );
}
