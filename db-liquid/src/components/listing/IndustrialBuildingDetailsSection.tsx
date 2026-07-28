import { FormSelect } from './FormSelect';
import {
  LAND_ZONE_OPTIONS,
  WAREHOUSE_FLOORS_ALLOWED_OPTIONS,
  WAREHOUSE_TOTAL_FLOOR_OPTIONS,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

type Props = {
  landZone: string;
  totalFloors: string;
  floorsAllowed: string;
  superArea: string;
  onLandZoneChange: (v: string) => void;
  onTotalFloorsChange: (v: string) => void;
  onFloorsAllowedChange: (v: string) => void;
  onSuperAreaChange: (v: string) => void;
};

export function IndustrialBuildingDetailsSection({
  landZone,
  totalFloors,
  floorsAllowed,
  superArea,
  onLandZoneChange,
  onTotalFloorsChange,
  onFloorsAllowedChange,
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
