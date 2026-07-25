import { HelpCircle } from 'lucide-react';
import {
  AGE_OF_CONSTRUCTION_OPTIONS,
  AVAILABLE_FROM_MONTHS,
  availableFromYears,
  POSSESSION_OPTIONS,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

const selectClass =
  'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

function YesNoRadioRow({
  label,
  name,
  value,
  onChange,
  help,
}: {
  label: string;
  name: string;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
  help?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
        {label}
        {help && (
          <span title={help} className="text-gray-400 inline-flex" aria-label={help}>
            <HelpCircle size={14} />
          </span>
        )}
      </span>
      <div className="flex items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === true}
            onChange={() => onChange(true)}
            className="w-4 h-4 accent-primary"
          />
          Yes
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="radio"
            name={name}
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
  possession: string;
  availableFromMonth: string;
  availableFromYear: string;
  ageOfConstruction: string;
  bookingTokenAmount: string;
  priceNegotiable: boolean;
  /** Commercial Showroom — leased + assured returns rows */
  showShowroomAvailability?: boolean;
  currentlyLeasedOut?: boolean | undefined;
  assuredReturn?: boolean;
  assuredReturnPercent?: string;
  onPossessionChange: (v: string) => void;
  onAvailableFromMonthChange: (v: string) => void;
  onAvailableFromYearChange: (v: string) => void;
  onAgeOfConstructionChange: (v: string) => void;
  onBookingTokenAmountChange: (v: string) => void;
  onPriceNegotiableChange: (v: boolean) => void;
  onCurrentlyLeasedOutChange?: (v: boolean) => void;
  onAssuredReturnChange?: (v: boolean) => void;
  onAssuredReturnPercentChange?: (v: string) => void;
};

export function TransactionAvailabilitySection({
  possession,
  availableFromMonth,
  availableFromYear,
  ageOfConstruction,
  bookingTokenAmount,
  priceNegotiable,
  showShowroomAvailability = false,
  currentlyLeasedOut,
  assuredReturn = false,
  assuredReturnPercent = '',
  onPossessionChange,
  onAvailableFromMonthChange,
  onAvailableFromYearChange,
  onAgeOfConstructionChange,
  onBookingTokenAmountChange,
  onPriceNegotiableChange,
  onCurrentlyLeasedOutChange,
  onAssuredReturnChange,
  onAssuredReturnPercentChange,
}: Props) {
  return (
    <section className="space-y-4 pt-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        Transaction type, property availability
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <span className="text-sm font-medium text-gray-600">Possession status</span>
        <div className="flex flex-wrap items-center gap-6">
          {POSSESSION_OPTIONS.map((option) => (
            <label
              key={option}
              className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="transaction-possession"
                checked={possession === option}
                onChange={() => onPossessionChange(option)}
                className="w-4 h-4 accent-primary"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {showShowroomAvailability && onCurrentlyLeasedOutChange && onAssuredReturnChange && (
        <>
          <YesNoRadioRow
            label="Currently Leased out"
            name="currently-leased-out"
            value={currentlyLeasedOut}
            onChange={onCurrentlyLeasedOutChange}
          />
          <YesNoRadioRow
            label="Assured Returns"
            name="assured-returns"
            value={assuredReturn}
            onChange={onAssuredReturnChange}
            help="Guaranteed rental yield offered by the developer or seller for a fixed period."
          />
          {assuredReturn && onAssuredReturnPercentChange && (
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
        </>
      )}

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
  );
}
