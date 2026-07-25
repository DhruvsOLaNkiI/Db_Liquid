import { FormSelect } from './FormSelect';
import {
  COMMERCIAL_SHOP_FLOOR_LABEL_OPTIONS,
  COMMERCIAL_SHOP_FLOOR_NUMBER_OPTIONS,
  COMMERCIAL_SHOP_FURNISHING_OPTIONS,
  COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS,
  COMMERCIAL_SHOP_WASHROOM_OPTIONS,
  COMMERCIAL_SHOWROOM_FLOOR_LABEL_OPTIONS,
  COMMERCIAL_SHOWROOM_FLOOR_NUMBER_OPTIONS,
  COMMERCIAL_SHOWROOM_FLOORS_OFFERED_OPTIONS,
  COMMERCIAL_SHOWROOM_TOTAL_FLOOR_OPTIONS,
  LAND_ZONE_OPTIONS,
  PANTRY_CAFE_OPTIONS,
  SHOP_RIGHTS_OF_USE_OPTIONS,
  SHOP_TYPE_OPTIONS,
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

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 accent-primary"
      />
      {label}
    </label>
  );
}

type Props = {
  isShowroom?: boolean;
  builtUpArea: string;
  carpetArea: string;
  maintenanceCharges: string;
  plotArea: string;
  entranceWidthFeet: string;
  floorsOffered: string;
  landZone: string;
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
  floor: string;
  totalFloors: string;
  furnishing: string;
  shopWashrooms: string;
  cornerShop: boolean | undefined;
  mainRoadFacing: boolean | undefined;
  personalWashroom: boolean | undefined;
  pantryCafeteria: string;
  onBuiltUpAreaChange: (v: string) => void;
  onCarpetAreaChange: (v: string) => void;
  onMaintenanceChargesChange: (v: string) => void;
  onPlotAreaChange: (v: string) => void;
  onEntranceWidthFeetChange: (v: string) => void;
  onFloorsOfferedChange: (v: string) => void;
  onLandZoneChange: (v: string) => void;
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
  isShowroom = false,
  builtUpArea,
  carpetArea,
  maintenanceCharges,
  plotArea,
  entranceWidthFeet,
  floorsOffered,
  landZone,
  assetStatus: _assetStatus,
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
  floor,
  totalFloors,
  furnishing,
  shopWashrooms,
  cornerShop,
  mainRoadFacing,
  personalWashroom,
  pantryCafeteria,
  onBuiltUpAreaChange,
  onCarpetAreaChange,
  onMaintenanceChargesChange,
  onPlotAreaChange,
  onEntranceWidthFeetChange,
  onFloorsOfferedChange,
  onLandZoneChange,
  onAssetStatusChange: _onAssetStatusChange,
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
  onFloorChange,
  onTotalFloorsChange,
  onFurnishingChange,
  onShopWashroomsChange,
  onCornerShopChange,
  onMainRoadFacingChange,
  onPersonalWashroomChange,
  onPantryCafeteriaChange,
}: Props) {
  const floorLabels = isShowroom
    ? COMMERCIAL_SHOWROOM_FLOOR_LABEL_OPTIONS
    : COMMERCIAL_SHOP_FLOOR_LABEL_OPTIONS;
  const floorNumbers = isShowroom
    ? COMMERCIAL_SHOWROOM_FLOOR_NUMBER_OPTIONS
    : COMMERCIAL_SHOP_FLOOR_NUMBER_OPTIONS;
  const totalFloorOptions = isShowroom
    ? COMMERCIAL_SHOWROOM_TOTAL_FLOOR_OPTIONS
    : COMMERCIAL_SHOP_TOTAL_FLOOR_OPTIONS;

  return (
    <div className="space-y-8">
      {!isShowroom && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Unit details
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3">
              <p className="text-sm font-medium text-gray-600">Payment</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <CheckboxRow
                  label="Payment complete"
                  checked={paymentComplete}
                  onChange={(checked) => {
                    onPaymentCompleteChange(checked);
                    if (checked) onPaymentRemainingChange(false);
                  }}
                />
                <CheckboxRow
                  label="Payment remaining"
                  checked={paymentRemaining}
                  onChange={(checked) => {
                    onPaymentRemainingChange(checked);
                    if (checked) onPaymentCompleteChange(false);
                  }}
                />
              </div>

              {paymentRemaining && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Remaining payment (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={paymentRemainingPercent}
                    onChange={(e) => onPaymentRemainingPercentChange(e.target.value)}
                    placeholder="e.g. 30"
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3">
              <p className="text-sm font-medium text-gray-600">Returns</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <CheckboxRow
                  label="Assured return"
                  checked={assuredReturn}
                  onChange={onAssuredReturnChange}
                />
                <CheckboxRow
                  label="Lease guarantee"
                  checked={leaseGuarantee}
                  onChange={onLeaseGuaranteeChange}
                />
              </div>

              {assuredReturn && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Assured return (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={assuredReturnPercent}
                    onChange={(e) => onAssuredReturnPercentChange(e.target.value)}
                    placeholder="e.g. 8"
                    className={inputClass}
                  />
                </div>
              )}

              {leaseGuarantee && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Lease guarantee amount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={leaseGuaranteeAmount}
                    onChange={(e) => onLeaseGuaranteeAmountChange(e.target.value)}
                    placeholder="e.g. 50000"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Ideal for businesses
            </label>
            <input
              type="text"
              value={idealForBusinesses}
              onChange={(e) => onIdealForBusinessesChange(e.target.value)}
              placeholder="e.g. Retail, Restaurant, Clinic"
              className={inputClass}
            />
          </div>
        </section>
      )}

      {!isShowroom && (
        <section className="space-y-5 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Rights of use
          </h2>

          <OptionPills
            label="Rights of use"
            options={SHOP_RIGHTS_OF_USE_OPTIONS}
            value={rightsOfUse}
            onChange={onRightsOfUseChange}
          />

          <OptionPills
            label="Type"
            options={SHOP_TYPE_OPTIONS}
            value={shopType}
            onChange={onShopTypeChange}
          />
        </section>
      )}

      <section className="space-y-5 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Property features
        </h2>

        {isShowroom && (
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
        )}

        <div className="space-y-3">
          <OptionPills
            label="Floor no."
            options={floorLabels}
            value={(floorLabels as readonly string[]).includes(floor) ? floor : ''}
            onChange={onFloorChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Or select floor number
            </label>
            <select
              value={(floorNumbers as readonly string[]).includes(floor) ? floor : ''}
              onChange={(e) => onFloorChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select floor number</option>
              {floorNumbers.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Total floors</label>
          <select
            value={totalFloors}
            onChange={(e) => onTotalFloorsChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select total floors</option>
            {totalFloorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {isShowroom && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Floor(s) offered for sale
            </label>
            <FormSelect
              value={floorsOffered}
              onChange={onFloorsOfferedChange}
              options={COMMERCIAL_SHOWROOM_FLOORS_OFFERED_OPTIONS}
              placeholder="Select"
              className={selectClass}
              aria-label="Floor(s) offered for sale"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Washrooms</label>
          <select
            value={shopWashrooms}
            onChange={(e) => onShopWashroomsChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select washrooms</option>
            {COMMERCIAL_SHOP_WASHROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <OptionPills
          label="Furnished status"
          options={COMMERCIAL_SHOP_FURNISHING_OPTIONS}
          value={furnishing}
          onChange={onFurnishingChange}
        />

        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-2 space-y-1">
          <YesNoChoice
            label={isShowroom ? 'Corner showroom' : 'Corner unit'}
            value={cornerShop}
            onChange={onCornerShopChange}
          />
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
          <label className="block text-sm font-medium text-gray-600 mb-2">
            {isShowroom ? 'Covered / built-up area (sq.ft)' : 'Built-up area (sq.ft)'}
          </label>
          <input
            type="number"
            value={builtUpArea}
            onChange={(e) => onBuiltUpAreaChange(e.target.value)}
            placeholder="e.g. 10000"
            className={inputClass}
          />
        </div>
        {isShowroom && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Plot area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={plotArea}
                onChange={(e) => onPlotAreaChange(e.target.value)}
                placeholder="e.g. 2000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Width of entrance (ft){' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={entranceWidthFeet}
                onChange={(e) => onEntranceWidthFeetChange(e.target.value)}
                placeholder="e.g. 20"
                className={inputClass}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Carpet area (sq.ft) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={carpetArea}
            onChange={(e) => onCarpetAreaChange(e.target.value)}
            placeholder="e.g. 8500"
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
            placeholder="e.g. 5000 / month"
            className={inputClass}
          />
        </div>
      </section>
    </div>
  );
}
