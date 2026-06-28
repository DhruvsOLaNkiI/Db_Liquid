import { MapPin } from 'lucide-react';
import { INDIAN_STATES } from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

type Props = {
  propertyType: string;
  showFloorFields: boolean;
  locality: string;
  address: string;
  state: string;
  pincode: string;
  floor: string;
  totalFloors: string;
  onLocalityChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onPincodeChange: (v: string) => void;
  onFloorChange: (v: string) => void;
  onTotalFloorsChange: (v: string) => void;
};

export function SellerLocalityStep({
  propertyType,
  showFloorFields,
  locality,
  address,
  state,
  pincode,
  floor,
  totalFloors,
  onLocalityChange,
  onAddressChange,
  onStateChange,
  onPincodeChange,
  onFloorChange,
  onTotalFloorsChange,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <MapPin className="text-primary mb-4" size={28} />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Location</h1>
        <p className="text-gray-600">
          Where is your {propertyType.toLowerCase() || 'property'}? Buyers see this on the listing page.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="locality" className="block text-sm font-medium text-gray-600 mb-2">
            Locality / City <span className="text-red-500">*</span>
          </label>
          <input
            id="locality"
            type="text"
            value={locality}
            onChange={(e) => onLocalityChange(e.target.value)}
            placeholder="e.g. Sector 62, Noida"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-600 mb-2">
            Full address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            rows={3}
            placeholder="House / flat no., building or society name, street, landmark"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-600 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              id="state"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-600 mb-2">
              Pincode
            </label>
            <input
              id="pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 201301"
              className={inputClass}
            />
          </div>
        </div>

        {showFloorFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-600 mb-2">
                Floor no.
              </label>
              <input
                id="floor"
                type="text"
                value={floor}
                onChange={(e) => onFloorChange(e.target.value)}
                placeholder="e.g. 3 or Ground"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="totalFloors" className="block text-sm font-medium text-gray-600 mb-2">
                Total floors in building
              </label>
              <input
                id="totalFloors"
                type="number"
                min={1}
                value={totalFloors}
                onChange={(e) => onTotalFloorsChange(e.target.value)}
                placeholder="e.g. 12"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
