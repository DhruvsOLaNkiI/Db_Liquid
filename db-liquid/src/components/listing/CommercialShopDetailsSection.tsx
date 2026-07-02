import {
  COMMERCIAL_SHOP_FLOOR_OPTIONS,
  COMMERCIAL_SHOP_FURNISHING_OPTIONS,
  COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS,
  COMMERCIAL_SHOP_WASHROOM_OPTIONS,
  LAND_ZONE_OPTIONS,
  PANTRY_CAFE_OPTIONS,
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
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0">
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
  builtUpArea: string;
  landZone: string;
  idealForBusinesses: string;
  floor: string;
  totalFloors: string;
  furnishing: string;
  shopWashrooms: string;
  cornerShop: boolean | undefined;
  mainRoadFacing: boolean | undefined;
  personalWashroom: boolean | undefined;
  pantryCafeteria: string;
  onBuiltUpAreaChange: (v: string) => void;
  onLandZoneChange: (v: string) => void;
  onIdealForBusinessesChange: (v: string) => void;
  onFloorChange: (v: string) => void;
  onTotalFloorsChange: (v: string) => void;
  onFurnishingChange: (v: string) => void;
  onShopWashroomsChange: (v: string) => void;
  onCornerShopChange: (v: boolean) => void;
  onMainRoadFacingChange: (v: boolean) => void;
  onPersonalWashroomChange: (v: boolean) => void;
  onPantryCafeteriaChange: (v: string) => void;
};

export function CommercialShopDetailsSection({
  builtUpArea,
  landZone,
  idealForBusinesses,
  floor,
  totalFloors,
  furnishing,
  shopWashrooms,
  cornerShop,
  mainRoadFacing,
  personalWashroom,
  pantryCafeteria,
  onBuiltUpAreaChange,
  onLandZoneChange,
  onIdealForBusinessesChange,
  onFloorChange,
  onTotalFloorsChange,
  onFurnishingChange,
  onShopWashroomsChange,
  onCornerShopChange,
  onMainRoadFacingChange,
  onPersonalWashroomChange,
  onPantryCafeteriaChange,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Shop details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Land zone</label>
          <select
            value={landZone}
            onChange={(e) => onLandZoneChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select land zone</option>
            {LAND_ZONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Ideal for businesses</label>
          <input
            type="text"
            value={idealForBusinesses}
            onChange={(e) => onIdealForBusinessesChange(e.target.value)}
            placeholder="e.g. Retail, Restaurant, Clinic"
            className={inputClass}
          />
        </div>
      </section>

      <section className="space-y-5 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Property features
        </h2>

        <OptionPills
          label="Floor no."
          options={COMMERCIAL_SHOP_FLOOR_OPTIONS}
          value={floor}
          onChange={onFloorChange}
        />

        <OptionPills
          label="Total floors"
          options={COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS}
          value={totalFloors}
          onChange={onTotalFloorsChange}
        />

        <OptionPills
          label="Washrooms"
          options={COMMERCIAL_SHOP_WASHROOM_OPTIONS}
          value={shopWashrooms}
          onChange={onShopWashroomsChange}
        />

        <OptionPills
          label="Furnished status"
          options={COMMERCIAL_SHOP_FURNISHING_OPTIONS}
          value={furnishing}
          onChange={onFurnishingChange}
        />

        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-2 space-y-1">
          <YesNoChoice label="Corner shop" value={cornerShop} onChange={onCornerShopChange} />
          <YesNoChoice
            label="Is main road facing"
            value={mainRoadFacing}
            onChange={onMainRoadFacingChange}
          />
          <YesNoChoice
            label="Personal washroom"
            value={personalWashroom}
            onChange={onPersonalWashroomChange}
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-600 mb-2.5">Pantry / cafeteria</p>
          <div className="flex flex-wrap gap-2">
            {PANTRY_CAFE_OPTIONS.map((option) => (
              <label
                key={option}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                  pantryCafeteria === option
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="pantry-cafeteria"
                  checked={pantryCafeteria === option}
                  onChange={() => onPantryCafeteriaChange(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Area</h2>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Built-up area (sq.ft)</label>
          <input
            type="number"
            value={builtUpArea}
            onChange={(e) => onBuiltUpAreaChange(e.target.value)}
            placeholder="e.g. 10000"
            className={inputClass}
          />
        </div>
      </section>
    </div>
  );
}
