import { useState } from 'react';
import { CommercialShopDetailsSection } from './CommercialShopDetailsSection';
import {
  applyPlotAreaInput,
  FACING_OPTIONS,
  FURNISHING_OPTIONS,
  PLOT_AREA_UNIT_OPTIONS,
  PLOT_OPEN_SIDES_OPTIONS,
  plotUnitLinearLabel,
  POSSESSION_OPTIONS,
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
  isCommercialShop: boolean;
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
  onPlotWidthChange: (v: string) => void;
  onPlotLengthChange: (v: string) => void;
  onFurnishingChange: (v: string) => void;
  onFacingChange: (v: string) => void;
  onParkingChange: (n: number) => void;
  onPossessionChange: (v: string) => void;
  onCornerPlotChange: (v: boolean) => void;
  onBoundaryWallChange: (v: boolean) => void;
  onPlotOpenSidesChange: (v: string) => void;
  onPlotRoadWidthMetersChange: (v: string) => void;
  onPlotConstructionDoneChange: (v: boolean) => void;
  onPlotGatedColonyChange: (v: boolean) => void;
  onLandZoneChange: (v: string) => void;
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
  isCommercialShop,
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
  landZone,
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
  onPlotWidthChange,
  onPlotLengthChange,
  onFurnishingChange,
  onFacingChange,
  onParkingChange,
  onPossessionChange,
  onCornerPlotChange,
  onBoundaryWallChange,
  onPlotOpenSidesChange,
  onPlotRoadWidthMetersChange,
  onPlotConstructionDoneChange,
  onPlotGatedColonyChange,
  onLandZoneChange,
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
  const linearUnit = plotUnitLinearLabel(plotAreaUnit);

  function handleApplyPlotArea() {
    const result = applyPlotAreaInput(plotAreaUnit, plotAreaInput, plotWidth, plotLength);
    if ('error' in result) {
      setApplyMessage(result.error);
      return;
    }

    onLandSqFtChange(result.sqFt);
    if (!plotAreaInput.trim() && plotWidth.trim() && plotLength.trim()) {
      setPlotAreaInput(result.areaInUnit);
    }
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Plot area</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={plotAreaInput}
                onChange={(e) => {
                  setPlotAreaInput(e.target.value);
                  setApplyMessage('');
                }}
                placeholder="Plot area"
                className={`${inputClass} flex-1 min-w-0`}
              />
              <select
                value={plotAreaUnit}
                onChange={(e) => {
                  setPlotAreaUnit(e.target.value as PlotAreaUnit);
                  setApplyMessage('');
                }}
                className={`${selectClass} w-[108px] shrink-0`}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Plot width ({linearUnit})
              </label>
              <input
                type="number"
                value={plotWidth}
                onChange={(e) => {
                  onPlotWidthChange(e.target.value);
                  setApplyMessage('');
                }}
                placeholder={`Width (${linearUnit})`}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Plot length ({linearUnit})
              </label>
              <input
                type="number"
                value={plotLength}
                onChange={(e) => {
                  onPlotLengthChange(e.target.value);
                  setApplyMessage('');
                }}
                placeholder={`Length (${linearUnit})`}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleApplyPlotArea}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-gray-800 transition-colors"
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
      ) : isCommercialShop ? (
        <CommercialShopDetailsSection
          builtUpArea={builtUpArea}
          landZone={landZone}
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
          onLandZoneChange={onLandZoneChange}
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
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Parking slots</label>
              <CountStepper label="Parking" value={parking} onChange={onParkingChange} />
            </div>
          </div>
        </section>
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
