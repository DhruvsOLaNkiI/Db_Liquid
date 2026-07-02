import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, IndianRupee, Save } from 'lucide-react';
import { Header } from '../components/Header';
import { SellerLocalityStep } from '../components/listing/SellerLocalityStep';
import { SellerPhotosStep } from '../components/listing/SellerPhotosStep';
import { SellerPropertyDetailsStep } from '../components/listing/SellerPropertyDetailsStep';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { isPlotType, isResidentialUnitType, isCommercialShopType } from '../data/propertyTypes';
import { formatPrice, getTotalPrice } from '../types/listing';
import {
  canEditListing,
  editFormToListingPatch,
  listingToEditForm,
  validateEditForm,
  type ListingEditFormState,
} from '../utils/listingEditForm';
import { getDisplayListingId } from '../utils/listingDisplay';

const STEPS = ['Location', 'Details', 'Photos', 'Pricing'] as const;
type Step = (typeof STEPS)[number];

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, sessionReady } = useAuth();
  const { getListingById, updateListingDetails } = useListings();

  const listing = id ? getListingById(id) : undefined;
  const initialForm = useMemo(
    () => (listing ? listingToEditForm(listing) : null),
    [listing],
  );

  const [step, setStep] = useState<Step>('Location');
  const [form, setForm] = useState<ListingEditFormState | null>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?next=/seller/listing/${id}/edit`} replace />;
  }

  if (!listing || !form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-28 px-4 text-center">
          <p className="text-gray-600 mb-4">Listing not found.</p>
          <Link to="/profile" className="text-primary font-medium hover:underline">
            Back to profile
          </Link>
        </main>
      </div>
    );
  }

  if (listing.sellerId !== user.id) {
    return <Navigate to="/profile" replace />;
  }

  if (!canEditListing(listing, user.id)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-28 px-4 max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Cannot edit this listing</h1>
          <p className="text-gray-600 mb-6">
            Only active listings with no accepted bid can be edited. On-hold and closed listings are
            locked.
          </p>
          <Link
            to="/profile"
            className="inline-flex px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-gray-800"
          >
            Back to profile
          </Link>
        </main>
      </div>
    );
  }

  const isPlot = isPlotType(listing.propertyType);
  const isResidential = isResidentialUnitType(listing.propertyType);
  const isCommercialShop = isCommercialShopType(listing.propertyType);
  const showFloorFields = !isPlot && !isCommercialShop;
  const totalPrice = getTotalPrice(form.pricePerSqFt, isPlot ? Number(form.landSqFt) : Number(form.builtUpArea));

  const patchForm = (patch: Partial<ListingEditFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  const handleSave = () => {
    setError('');
    const validationError = validateEditForm(listing, form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const result = updateListingDetails(listing.id, user.id, editFormToListingPatch(listing, form));
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    window.setTimeout(() => navigate('/profile'), 1200);
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Listing updated</h1>
          <p className="text-gray-600">Redirecting to your profile…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            Back to profile
          </Link>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {getDisplayListingId(listing.id)} · {listing.propertyType}
            </p>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Edit listing</h1>
            <p className="text-gray-600">{listing.location}</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {STEPS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(label)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  step === label
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm mb-6">
            {step === 'Location' && (
              <SellerLocalityStep
                propertyType={listing.propertyType}
                showFloorFields={showFloorFields}
                locality={form.locality}
                address={form.address}
                state={form.stateName}
                pincode={form.pincode}
                floor={form.floor}
                totalFloors={form.totalFloors}
                onLocalityChange={(v) => patchForm({ locality: v })}
                onAddressChange={(v) => patchForm({ address: v })}
                onStateChange={(v) => patchForm({ stateName: v })}
                onPincodeChange={(v) => patchForm({ pincode: v })}
                onFloorChange={(v) => patchForm({ floor: v })}
                onTotalFloorsChange={(v) => patchForm({ totalFloors: v })}
              />
            )}

            {step === 'Details' && (
              <SellerPropertyDetailsStep
                isPlot={isPlot}
                isResidential={isResidential}
                isCommercialShop={isCommercialShop}
                bedrooms={form.bedrooms}
                washrooms={form.washrooms}
                balconies={form.balconies}
                kitchens={form.kitchens}
                hasServiceRoom={form.hasServiceRoom}
                hasStudyRoom={form.hasStudyRoom}
                builtUpArea={form.builtUpArea}
                landSqFt={form.landSqFt}
                plotWidth={form.plotWidth}
                plotLength={form.plotLength}
                furnishing={form.furnishing}
                facing={form.facing}
                parking={form.parking}
                possession={form.possession}
                cornerPlot={form.cornerPlot}
                boundaryWall={form.boundaryWall}
                plotOpenSides={form.plotOpenSides}
                plotRoadWidthMeters={form.plotRoadWidthMeters}
                plotConstructionDone={form.plotConstructionDone}
                plotGatedColony={form.plotGatedColony}
                landZone={form.landZone}
                idealForBusinesses={form.idealForBusinesses}
                shopFloor={form.floor}
                shopTotalFloors={form.totalFloors}
                shopWashrooms={form.shopWashrooms}
                cornerShop={form.cornerShop}
                mainRoadFacing={form.mainRoadFacing}
                personalWashroom={form.personalWashroom}
                pantryCafeteria={form.pantryCafeteria}
                propertyHighlights={form.propertyHighlights}
                onBedroomsChange={(v) => patchForm({ bedrooms: v })}
                onWashroomsChange={(v) => patchForm({ washrooms: v })}
                onBalconiesChange={(v) => patchForm({ balconies: v })}
                onKitchensChange={(v) => patchForm({ kitchens: v })}
                onHasServiceRoomChange={(v) => patchForm({ hasServiceRoom: v })}
                onHasStudyRoomChange={(v) => patchForm({ hasStudyRoom: v })}
                onBuiltUpAreaChange={(v) => patchForm({ builtUpArea: v })}
                onLandSqFtChange={(v) => patchForm({ landSqFt: v })}
                onPlotWidthChange={(v) => patchForm({ plotWidth: v })}
                onPlotLengthChange={(v) => patchForm({ plotLength: v })}
                onFurnishingChange={(v) => patchForm({ furnishing: v })}
                onFacingChange={(v) => patchForm({ facing: v })}
                onParkingChange={(v) => patchForm({ parking: v })}
                onPossessionChange={(v) => patchForm({ possession: v })}
                onCornerPlotChange={(v) => patchForm({ cornerPlot: v })}
                onBoundaryWallChange={(v) => patchForm({ boundaryWall: v })}
                onPlotOpenSidesChange={(v) => patchForm({ plotOpenSides: v })}
                onPlotRoadWidthMetersChange={(v) => patchForm({ plotRoadWidthMeters: v })}
                onPlotConstructionDoneChange={(v) => patchForm({ plotConstructionDone: v })}
                onPlotGatedColonyChange={(v) => patchForm({ plotGatedColony: v })}
                onLandZoneChange={(v) => patchForm({ landZone: v })}
                onIdealForBusinessesChange={(v) => patchForm({ idealForBusinesses: v })}
                onShopFloorChange={(v) => patchForm({ floor: v })}
                onShopTotalFloorsChange={(v) => patchForm({ totalFloors: v })}
                onShopWashroomsChange={(v) => patchForm({ shopWashrooms: v })}
                onCornerShopChange={(v) => patchForm({ cornerShop: v })}
                onMainRoadFacingChange={(v) => patchForm({ mainRoadFacing: v })}
                onPersonalWashroomChange={(v) => patchForm({ personalWashroom: v })}
                onPantryCafeteriaChange={(v) => patchForm({ pantryCafeteria: v })}
                onPropertyHighlightsChange={(v) => patchForm({ propertyHighlights: v })}
              />
            )}

            {step === 'Photos' && (
              <SellerPhotosStep
                photos={form.propertyPhotos}
                photoNote={form.photoNote}
                onPhotosChange={(photos) => patchForm({ propertyPhotos: photos })}
                onPhotoNoteChange={(v) => patchForm({ photoNote: v })}
              />
            )}

            {step === 'Pricing' && (
              <div className="space-y-6">
                <div>
                  <IndianRupee className="text-primary mb-4" size={28} />
                  <h2 className="text-3xl font-bold tracking-tight mb-2">Ask bid price</h2>
                  <p className="text-gray-600">Update your listed price per sq.ft.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Price per sq.ft
                  </label>
                  <input
                    type="number"
                    value={form.pricePerSqFt}
                    onChange={(e) => patchForm({ pricePerSqFt: e.target.value })}
                    placeholder="₹ per sq.ft"
                    className={inputClass}
                    min={1}
                  />
                </div>
                {totalPrice > 0 && (
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-500 mb-1">Total ask price</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving…' : 'Save listing changes'}
          </button>
        </div>
      </main>
    </div>
  );
}
