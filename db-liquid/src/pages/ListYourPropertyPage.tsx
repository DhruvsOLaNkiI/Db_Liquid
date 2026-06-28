import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Home, IndianRupee, Building2 } from 'lucide-react';
import { Header } from '../components/Header';
import { SellerLocalityStep } from '../components/listing/SellerLocalityStep';
import { SellerPhotosStep } from '../components/listing/SellerPhotosStep';
import { SellerPropertyDetailsStep } from '../components/listing/SellerPropertyDetailsStep';
import {
  SellerVerificationStep,
  verificationStepIsValid,
  type PendingVerificationUpload,
} from '../components/listing/SellerVerificationStep';
import { PropertyTypeSelect } from '../components/PropertyTypeSelect';
import { useListings } from '../context/ListingsContext';
import { isPlotType, isResidentialUnitType } from '../data/propertyTypes';
import { formatPrice, getAreaSqFt, getTotalPrice, getBiddingEndDate } from '../types/listing';
import type { ListingVerifications, PropertyListing, PropertyPhoto, VerificationDocType, VerificationDocument } from '../types/listing';
import { useAuth } from '../context/AuthContext';
import { getSellerName, getSellerPhone, resolveSellerId, setSellerName, setSellerPhone } from '../utils/seller';
import { buildListingDetailsSummary, buildListingLocation, getVerificationBadgeLabels, VERIFICATION_FIELDS } from '../utils/listingDisplay';
import { randomId } from '../utils/randomId';

const STEPS = ['You', 'Type', 'Location', 'Details', 'Pricing', 'Photos', 'Verify', 'Publish'] as const;

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

export function ListYourPropertyPage() {
  const { addListing } = useListings();
  const { user, hasRole } = useAuth();
  const sellerAccountId = hasRole('seller') ? user?.id : null;
  const [step, setStep] = useState(0);
  const [role] = useState('Owner');
  const [intent] = useState('Sell');
  const [propertyType, setPropertyType] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [washrooms, setWashrooms] = useState(2);
  const [balconies, setBalconies] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [hasServiceRoom, setHasServiceRoom] = useState(false);
  const [hasStudyRoom, setHasStudyRoom] = useState(false);
  const [builtUpArea, setBuiltUpArea] = useState('');
  const [landSqFt, setLandSqFt] = useState('');
  const [plotWidth, setPlotWidth] = useState('');
  const [plotLength, setPlotLength] = useState('');
  const [verifications, setVerifications] = useState<ListingVerifications>({
    titleVerified: false,
    postedByOwner: false,
    bankApproved: false,
    freehold: false,
  });
  const [verificationUploads, setVerificationUploads] = useState<
    Partial<Record<VerificationDocType, PendingVerificationUpload>>
  >({});
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>([]);
  const [furnishing, setFurnishing] = useState('');
  const [facing, setFacing] = useState('');
  const [parking, setParking] = useState(1);
  const [possession, setPossession] = useState('');
  const [cornerPlot, setCornerPlot] = useState(false);
  const [boundaryWall, setBoundaryWall] = useState(false);
  const [propertyHighlights, setPropertyHighlights] = useState('');
  const [pricePerSqFt, setPricePerSqFt] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [published, setPublished] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  const progress = ((step + 1) / STEPS.length) * 100;

  const isPlot = isPlotType(propertyType);
  const isResidential = isResidentialUnitType(propertyType);
  const showFloorFields = !isPlot && propertyType.length > 0;
  const location = locality.trim() && stateName.trim() ? buildListingLocation(locality, stateName) : '';
  const areaSqFt = getAreaSqFt(isPlot, builtUpArea, landSqFt);
  const totalPrice = getTotalPrice(pricePerSqFt, areaSqFt);

  const detailsSummary = buildListingDetailsSummary({
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
    furnishing: furnishing || undefined,
    facing: facing || undefined,
    parking: parking || undefined,
    possession: possession || undefined,
    cornerPlot,
    boundaryWall,
  });

  function setVerificationUpload(type: VerificationDocType, upload: PendingVerificationUpload | null) {
    setVerificationUploads((prev) => {
      const next = { ...prev };
      if (upload) next[type] = upload;
      else delete next[type];
      return next;
    });
  }

  function buildVerificationDocuments(): VerificationDocument[] {
    const now = new Date().toISOString();
    return VERIFICATION_FIELDS.filter(({ key }) => verifications[key] && verificationUploads[key])
      .map(({ key }) => {
        const upload = verificationUploads[key]!;
        return {
          id: randomId(),
          type: key,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          dataUrl: upload.dataUrl,
          uploadedAt: now,
          status: 'pending' as const,
        };
      });
  }

  const verificationLabels = getVerificationBadgeLabels(verifications);
  const pendingVerificationCount = buildVerificationDocuments().length;

  const canContinue = () => {
    if (step === 1) return propertyType.length > 0;
    if (step === 2) {
      return locality.trim().length > 0 && address.trim().length > 0 && stateName.trim().length > 0;
    }
    if (step === 3) {
      if (isPlot) return landSqFt.trim() && plotWidth.trim() && plotLength.trim();
      if (isResidential) return bedrooms > 0 && builtUpArea.trim().length > 0;
      return builtUpArea.trim().length > 0;
    }
    if (step === 4) return pricePerSqFt.trim().length > 0;
    if (step === 6) return verificationStepIsValid(verifications, verificationUploads);
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  function skipVerification() {
    setVerifications({
      titleVerified: false,
      postedByOwner: false,
      bankApproved: false,
      freehold: false,
    });
    setVerificationUploads({});
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  const publish = () => {
    const sellerId = resolveSellerId(sellerAccountId);
    const sellerName = user && hasRole('seller') ? user.name : getSellerName();
    const sellerPhone = user && hasRole('seller') ? user.phone : getSellerPhone();

    if (user && hasRole('seller')) {
      setSellerName(sellerName);
      setSellerPhone(sellerPhone);
    }

    const publishedAt = new Date().toISOString();
    const description = [propertyHighlights.trim(), photoNote.trim()].filter(Boolean).join('\n\n');
    const verificationDocuments = buildVerificationDocuments();
    const hasVerificationDocs = verificationDocuments.length > 0;

    const listing: PropertyListing = {
      id: crypto.randomUUID(),
      sellerId,
      sellerName,
      sellerPhone,
      propertyType,
      location,
      locality: locality.trim(),
      address: address.trim(),
      state: stateName.trim(),
      pincode: pincode.trim() || undefined,
      floor: showFloorFields && floor.trim() ? floor.trim() : undefined,
      totalFloors: showFloorFields && totalFloors.trim() ? totalFloors.trim() : undefined,
      pricePerSqFt: Number(pricePerSqFt),
      totalPrice,
      areaSqFt,
      detailsSummary,
      description,
      verifications: hasVerificationDocs
        ? {
            titleVerified: false,
            postedByOwner: false,
            bankApproved: false,
            freehold: false,
          }
        : verifications,
      verificationDocuments,
      verificationReviewStatus: hasVerificationDocs ? 'pending' : 'none',
      propertyPhotos,
      furnishing: furnishing || undefined,
      facing: facing || undefined,
      parking: parking || undefined,
      possession: possession || undefined,
      cornerPlot: isPlot ? cornerPlot : undefined,
      boundaryWall: isPlot ? boundaryWall : undefined,
      publishedAt,
      biddingEndsAt: getBiddingEndDate(publishedAt),
      bids: [],
      acceptedBidId: null,
      acceptedAt: null,
      proceededAt: null,
      tokenStatus: 'none',
      chatMessages: [],
      chatSellerName: '',
      chatSellerPhone: '',
      chatBuyerName: '',
      chatBuyerPhone: '',
    };
    addListing(listing);
    setVerificationSubmitted(hasVerificationDocs);
    setPublished(true);
  };

  if (published) {
    return (
      <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
        <Header />
        <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Listing published</h1>
            <p className="text-gray-600 mb-4">
              Your {propertyType} is live at <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {verificationSubmitted
                ? 'Your documents are under review. Verification badges appear after approval (about 5 seconds in prototype).'
                : 'Anyone can now see it on Browse listings.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/seller/dashboard"
                className="inline-block px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                Seller dashboard
              </Link>
              <Link
                to="/browse-property"
                className="inline-block px-8 py-4 border border-gray-200 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                View on Browse listings
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="text-xs font-medium text-gray-500">{STEPS[step]}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 gap-1">
              {STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`text-[10px] font-medium hidden sm:block ${
                    i <= step ? 'text-primary' : 'text-gray-300'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="min-h-[320px]">
            {step === 0 && (
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Fast listing</h1>
                <p className="text-gray-600 mb-8">A few quick steps. No long forms.</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/5">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {role[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">I am</p>
                      <p className="text-xl font-bold">{role}</p>
                    </div>
                    <Check className="ml-auto text-primary" size={22} />
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-primary bg-primary/5">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
                      <Home size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">I want to</p>
                      <p className="text-xl font-bold">{intent}</p>
                    </div>
                    <Check className="ml-auto text-primary" size={22} />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-6 text-center">Defaults set for you. Tap continue.</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <Building2 className="text-primary mb-4" size={28} />
                <h1 className="text-3xl font-bold tracking-tight mb-2">Property type</h1>
                <p className="text-gray-600 mb-8">Select what you are listing.</p>
                <PropertyTypeSelect value={propertyType} onChange={setPropertyType} />
              </div>
            )}

            {step === 2 && (
              <SellerLocalityStep
                propertyType={propertyType}
                showFloorFields={showFloorFields}
                locality={locality}
                address={address}
                state={stateName}
                pincode={pincode}
                floor={floor}
                totalFloors={totalFloors}
                onLocalityChange={setLocality}
                onAddressChange={setAddress}
                onStateChange={setStateName}
                onPincodeChange={setPincode}
                onFloorChange={setFloor}
                onTotalFloorsChange={setTotalFloors}
              />
            )}

            {step === 3 && (
              <SellerPropertyDetailsStep
                isPlot={isPlot}
                isResidential={isResidential}
                bedrooms={bedrooms}
                washrooms={washrooms}
                balconies={balconies}
                kitchens={kitchens}
                hasServiceRoom={hasServiceRoom}
                hasStudyRoom={hasStudyRoom}
                builtUpArea={builtUpArea}
                landSqFt={landSqFt}
                plotWidth={plotWidth}
                plotLength={plotLength}
                furnishing={furnishing}
                facing={facing}
                parking={parking}
                possession={possession}
                cornerPlot={cornerPlot}
                boundaryWall={boundaryWall}
                propertyHighlights={propertyHighlights}
                onBedroomsChange={setBedrooms}
                onWashroomsChange={setWashrooms}
                onBalconiesChange={setBalconies}
                onKitchensChange={setKitchens}
                onHasServiceRoomChange={setHasServiceRoom}
                onHasStudyRoomChange={setHasStudyRoom}
                onBuiltUpAreaChange={setBuiltUpArea}
                onLandSqFtChange={setLandSqFt}
                onPlotWidthChange={setPlotWidth}
                onPlotLengthChange={setPlotLength}
                onFurnishingChange={setFurnishing}
                onFacingChange={setFacing}
                onParkingChange={setParking}
                onPossessionChange={setPossession}
                onCornerPlotChange={setCornerPlot}
                onBoundaryWallChange={setBoundaryWall}
                onPropertyHighlightsChange={setPropertyHighlights}
              />
            )}

            {step === 4 && (
              <div>
                <IndianRupee className="text-primary mb-4" size={28} />
                <h1 className="text-3xl font-bold tracking-tight mb-2">Set your price</h1>
                <p className="text-gray-600 mb-8">Enter your price per square foot.</p>
                <input
                  type="number"
                  value={pricePerSqFt}
                  onChange={(e) => setPricePerSqFt(e.target.value)}
                  placeholder="₹ per sq.ft — e.g. 12500"
                  className={inputClass}
                  autoFocus
                />
              </div>
            )}

            {step === 5 && (
              <SellerPhotosStep
                photos={propertyPhotos}
                photoNote={photoNote}
                onPhotosChange={setPropertyPhotos}
                onPhotoNoteChange={setPhotoNote}
              />
            )}

            {step === 6 && (
              <SellerVerificationStep
                verifications={verifications}
                uploads={verificationUploads}
                onVerificationsChange={setVerifications}
                onUploadChange={setVerificationUpload}
              />
            )}

            {step === 7 && (
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Ready to publish?</h1>
                <p className="text-gray-600 mb-8">Quick review before going live.</p>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Listing as</span>
                    <span className="font-semibold">{role} · {intent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Property type</span>
                    <span className="font-semibold text-right max-w-[60%]">{propertyType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Location</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {locality}, {stateName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Address</span>
                    <span className="font-medium text-right max-w-[60%] text-gray-700">{address}</span>
                  </div>
                  {(pincode || floor) && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 shrink-0">Extra</span>
                      <span className="font-medium text-right max-w-[60%] text-gray-700">
                        {[pincode && `Pincode ${pincode}`, floor && `Floor ${floor}${totalFloors ? ` of ${totalFloors}` : ''}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Details</span>
                    <span className="font-semibold text-right max-w-[60%]">{detailsSummary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verification</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {pendingVerificationCount > 0
                        ? `${pendingVerificationCount} document${pendingVerificationCount !== 1 ? 's' : ''} pending review`
                        : verificationLabels.length > 0
                          ? verificationLabels.join(', ')
                          : 'Skipped'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {propertyPhotos.length > 0 ? `${propertyPhotos.length} uploaded` : 'None'}
                    </span>
                  </div>
                  {propertyHighlights.trim() && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 shrink-0">Highlights</span>
                      <span className="font-medium text-right max-w-[60%] text-gray-700 line-clamp-3">
                        {propertyHighlights.trim()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">Price</span>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">{formatPrice(totalPrice)}</p>
                      <p className="text-sm text-gray-500">₹{Number(pricePerSqFt).toLocaleString('en-IN')}/sq.ft · {areaSqFt.toLocaleString('en-IN')} sq.ft</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-10">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <Link
                to="/list-your-property"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canContinue()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-full font-medium text-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={publish}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-full font-medium text-lg hover:bg-gray-800 transition-colors"
              >
                Publish listing
                <Check size={18} />
              </button>
            )}
          </div>

          {step === 5 && (
            <button
              type="button"
              onClick={next}
              className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip photos for now
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={skipVerification}
              className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip this step
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
