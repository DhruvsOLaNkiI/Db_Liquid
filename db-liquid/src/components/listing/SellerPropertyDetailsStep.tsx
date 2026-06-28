import {
  FACING_OPTIONS,
  FURNISHING_OPTIONS,
  POSSESSION_OPTIONS,
} from '../../utils/listingDisplay';

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

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

type Props = {
  isPlot: boolean;
  isResidential: boolean;
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
  boundaryWall: boolean;
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
  onPropertyHighlightsChange: (v: string) => void;
};

export function SellerPropertyDetailsStep({
  isPlot,
  isResidential,
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
  onPropertyHighlightsChange,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Property details</h1>
        <p className="text-gray-600">
          Add configuration and highlights buyers see on your listing page.
        </p>
      </div>

      {isPlot ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Plot size</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Land (sq.ft)</label>
            <input
              type="number"
              value={landSqFt}
              onChange={(e) => onLandSqFtChange(e.target.value)}
              placeholder="e.g. 2400"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Width (ft)</label>
              <input
                type="number"
                value={plotWidth}
                onChange={(e) => onPlotWidthChange(e.target.value)}
                placeholder="e.g. 40"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Length (ft)</label>
              <input
                type="number"
                value={plotLength}
                onChange={(e) => onPlotLengthChange(e.target.value)}
                placeholder="e.g. 60"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <button
              type="button"
              onClick={() => onBoundaryWallChange(!boundaryWall)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                boundaryWall
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Boundary wall
            </button>
          </div>
        </section>
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
