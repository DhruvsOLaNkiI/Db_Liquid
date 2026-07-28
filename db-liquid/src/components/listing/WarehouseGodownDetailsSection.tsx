import { FormSelect } from './FormSelect';
import {
  LAND_ZONE_OPTIONS,
  PLOT_OPEN_SIDES_OPTIONS,
  WAREHOUSE_FLOOR_OPTIONS,
  WAREHOUSE_FLOORS_ALLOWED_OPTIONS,
  WAREHOUSE_FURNISHING_OPTIONS,
  WAREHOUSE_TOTAL_FLOOR_OPTIONS,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

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
  landZone: string;
  floor: string;
  totalFloors: string;
  furnishing: string;
  floorsAllowed: string;
  plotOpenSides: string;
  plotRoadWidthMeters: string;
  superArea: string;
  onLandZoneChange: (v: string) => void;
  onFloorChange: (v: string) => void;
  onTotalFloorsChange: (v: string) => void;
  onFurnishingChange: (v: string) => void;
  onFloorsAllowedChange: (v: string) => void;
  onPlotOpenSidesChange: (v: string) => void;
  onPlotRoadWidthMetersChange: (v: string) => void;
  onSuperAreaChange: (v: string) => void;
};

export function WarehouseGodownDetailsSection({
  landZone,
  floor,
  totalFloors,
  furnishing,
  floorsAllowed,
  plotOpenSides,
  plotRoadWidthMeters,
  superArea,
  onLandZoneChange,
  onFloorChange,
  onTotalFloorsChange,
  onFurnishingChange,
  onFloorsAllowedChange,
  onPlotOpenSidesChange,
  onPlotRoadWidthMetersChange,
  onSuperAreaChange,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Property features
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Land Zone</label>
          <FormSelect
            value={landZone}
            onChange={onLandZoneChange}
            options={LAND_ZONE_OPTIONS}
            placeholder="Select Land Zone"
            className={selectClass}
            aria-label="Land Zone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Floor no.</label>
          <FormSelect
            value={floor}
            onChange={onFloorChange}
            options={WAREHOUSE_FLOOR_OPTIONS}
            placeholder="Select floor"
            className={selectClass}
            aria-label="Floor no."
          />
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
            options={WAREHOUSE_FLOORS_ALLOWED_OPTIONS}
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
            Width of road facing the plot (meters)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step="0.1"
              value={plotRoadWidthMeters}
              onChange={(e) => onPlotRoadWidthMetersChange(e.target.value)}
              placeholder="e.g. 12"
              className={`${inputClass} pr-20`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              Meters
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Super area (sq.ft)</label>
          <input
            type="number"
            min={0}
            value={superArea}
            onChange={(e) => onSuperAreaChange(e.target.value)}
            placeholder="e.g. 5000"
            className={inputClass}
          />
        </div>
      </section>
    </div>
  );
}
