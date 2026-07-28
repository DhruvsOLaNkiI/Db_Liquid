import { FormSelect } from './FormSelect';
import {
  FLOORS_ALLOWED_OPTIONS,
  PLOT_OPEN_SIDES_OPTIONS,
  WAREHOUSE_FURNISHING_OPTIONS,
  WAREHOUSE_TOTAL_FLOOR_OPTIONS,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

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

function OptionPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-600 mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
              value === option
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  bedrooms: number;
  washrooms: number;
  totalFloors: string;
  furnishing: string;
  floorsAllowed: string;
  plotOpenSides: string;
  plotRoadWidthMeters: string;
  carpetArea: string;
  superArea: string;
  onBedroomsChange: (n: number) => void;
  onWashroomsChange: (n: number) => void;
  onTotalFloorsChange: (v: string) => void;
  onFurnishingChange: (v: string) => void;
  onFloorsAllowedChange: (v: string) => void;
  onPlotOpenSidesChange: (v: string) => void;
  onPlotRoadWidthMetersChange: (v: string) => void;
  onCarpetAreaChange: (v: string) => void;
  onSuperAreaChange: (v: string) => void;
};

export function FarmHouseDetailsSection({
  bedrooms,
  washrooms,
  totalFloors,
  furnishing,
  floorsAllowed,
  plotOpenSides,
  plotRoadWidthMeters,
  carpetArea,
  superArea,
  onBedroomsChange,
  onWashroomsChange,
  onTotalFloorsChange,
  onFurnishingChange,
  onFloorsAllowedChange,
  onPlotOpenSidesChange,
  onPlotRoadWidthMetersChange,
  onCarpetAreaChange,
  onSuperAreaChange,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Property features
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <CountStepper label="Bedrooms" value={bedrooms} onChange={onBedroomsChange} />
          <CountStepper label="Bathrooms" value={washrooms} onChange={onWashroomsChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Total floors</label>
          <FormSelect
            value={totalFloors}
            onChange={onTotalFloorsChange}
            options={WAREHOUSE_TOTAL_FLOOR_OPTIONS}
            placeholder="Select total floors"
            className={selectClass}
            aria-label="Total floors"
          />
        </div>

        <OptionPills
          label="Furnished status"
          options={WAREHOUSE_FURNISHING_OPTIONS}
          value={furnishing}
          onChange={onFurnishingChange}
        />

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Floors allowed for construction
          </label>
          <FormSelect
            value={floorsAllowed}
            onChange={onFloorsAllowedChange}
            options={FLOORS_ALLOWED_OPTIONS}
            placeholder="Total Floor"
            className={selectClass}
            aria-label="Floors allowed for construction"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">No. of open sides</label>
          <FormSelect
            value={plotOpenSides}
            onChange={onPlotOpenSidesChange}
            options={PLOT_OPEN_SIDES_OPTIONS}
            placeholder="Select"
            className={selectClass}
            aria-label="No. of open sides"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Width of road facing the plot
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              step="0.1"
              value={plotRoadWidthMeters}
              onChange={(e) => onPlotRoadWidthMetersChange(e.target.value)}
              placeholder="Road width"
              className={`${inputClass} flex-1 min-w-0`}
            />
            <span className="text-sm font-medium text-gray-500 shrink-0 w-14 text-right">
              Meters
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Carpet area (sq.ft)</label>
            <input
              type="number"
              min={0}
              value={carpetArea}
              onChange={(e) => onCarpetAreaChange(e.target.value)}
              placeholder="e.g. 2000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Super area (sq.ft)</label>
            <input
              type="number"
              min={0}
              value={superArea}
              onChange={(e) => onSuperAreaChange(e.target.value)}
              placeholder="e.g. 2500"
              className={inputClass}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
