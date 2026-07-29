import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Home, IndianRupee, Building2 } from 'lucide-react';
import { Header } from '../components/Header';
import { SellerLocalityStep } from '../components/listing/SellerLocalityStep';
import { ListingFormShell } from '../components/listing/ListingFormShell';
import { SellerPhotosStep } from '../components/listing/SellerPhotosStep';
import { SellerPropertyDetailsStep } from '../components/listing/SellerPropertyDetailsStep';
import {
  SellerVerificationStep,
  verificationStepIsValid,
  type PendingVerificationUpload,
} from '../components/listing/SellerVerificationStep';
import { PropertyTypeSelect } from '../components/PropertyTypeSelect';
import { useListings } from '../context/ListingsContext';
import {
  isPlotType,
  isResidentialUnitType,
  isCommercialUnitType,
  isVillaType,
  isBuilderFloorType,
  isPenthouseType,
  isCommercialShowroomType,
  isWarehouseGodownType,
  isIndustrialLandType,
  isIndustrialBuildingType,
  isIndustrialShedType,
  isAgriculturalLandType,
  isFarmHouseType,
} from '../data/propertyTypes';
import { formatPrice, getAreaSqFt, getTotalPrice, getBiddingEndDate } from '../types/listing';
import type { ListingVerifications, PropertyListing, PropertyPhoto, PropertyVideo, VerificationDocType, VerificationDocument } from '../types/listing';
import { useAuth } from '../context/AuthContext';
import { resolveSellerId, setSellerName, setSellerPhone } from '../utils/seller';
import { buildListingDetailsSummary, buildListingLocation, getVerificationBadgeLabels, VERIFICATION_FIELDS } from '../utils/listingDisplay';
import { uploadPrivateFile, uploadPrivateVideo } from '../utils/fileUpload';
import { takeGuestFile } from '../utils/guestMedia';
import { randomId } from '../utils/randomId';

const STEPS = ['Type', 'Location', 'Details', 'Pricing', 'Photos', 'Verify', 'Publish'] as const;

const inputClass =
  'w-full px-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-colors';

/** Guests can fill the whole form; the draft survives the login/signup round trip. */
const DRAFT_KEY = 'db-liquid-listing-draft';

function readListingDraft(): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function ListYourPropertyPage() {
  const { addListing } = useListings();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [draft] = useState(readListingDraft);
  const d = <T,>(key: string, fallback: T): T =>
    draft && key in draft && draft[key] !== undefined ? (draft[key] as T) : fallback;
  const [step, setStep] = useState(() => {
    const restored = Number(d('step', 0));
    return Number.isInteger(restored) && restored >= 0 && restored < STEPS.length ? restored : 0;
  });
  const [publishError, setPublishError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [role] = useState('Owner');
  const [intent] = useState('Sell');
  const [propertyType, setPropertyType] = useState(() => d('propertyType', ''));
  const [locality, setLocality] = useState(() => d('locality', ''));
  const [address, setAddress] = useState(() => d('address', ''));
  const [stateName, setStateName] = useState(() => d('stateName', ''));
  const [pincode, setPincode] = useState(() => d('pincode', ''));
  const [floor, setFloor] = useState(() => d('floor', ''));
  const [totalFloors, setTotalFloors] = useState(() => d('totalFloors', ''));
  const [bedrooms, setBedrooms] = useState(() => d('bedrooms', 2));
  const [washrooms, setWashrooms] = useState(() => d('washrooms', 2));
  const [balconies, setBalconies] = useState(() => d('balconies', 1));
  const [kitchens, setKitchens] = useState(() => d('kitchens', 1));
  const [hasServiceRoom, setHasServiceRoom] = useState(() => d('hasServiceRoom', false));
  const [hasStudyRoom, setHasStudyRoom] = useState(() => d('hasStudyRoom', false));
  const [builtUpArea, setBuiltUpArea] = useState(() => d('builtUpArea', ''));
  const [landSqFt, setLandSqFt] = useState(() => d('landSqFt', ''));
  const [propertyNumber, setPropertyNumber] = useState(() => d('propertyNumber', ''));
  const [plotWidth, setPlotWidth] = useState(() => d('plotWidth', ''));
  const [plotLength, setPlotLength] = useState(() => d('plotLength', ''));
  const [floorsAllowed, setFloorsAllowed] = useState(() => d('floorsAllowed', ''));
  const [projectName, setProjectName] = useState(() => d('projectName', ''));
  const [carpetArea, setCarpetArea] = useState(() => d('carpetArea', ''));
  const [superArea, setSuperArea] = useState(() => d('superArea', ''));
  const [maintenanceCharges, setMaintenanceCharges] = useState(() => d('maintenanceCharges', ''));
  const [verifications, setVerifications] = useState<ListingVerifications>(() =>
    d('verifications', {
      titleVerified: false,
      postedByOwner: false,
      bankApproved: false,
      freehold: false,
    }),
  );
  const [verificationUploads, setVerificationUploads] = useState<
    Partial<Record<VerificationDocType, PendingVerificationUpload>>
  >(() => d('verificationUploads', {}));
  const [propertyPhotos, setPropertyPhotos] = useState<PropertyPhoto[]>(() =>
    d('propertyPhotos', []),
  );
  const [propertyVideos, setPropertyVideos] = useState<PropertyVideo[]>(() =>
    d('propertyVideos', []),
  );
  const [furnishing, setFurnishing] = useState(() => d('furnishing', ''));
  const [facing, setFacing] = useState(() => d('facing', ''));
  const [parking, setParking] = useState(() => d('parking', 1));
  const [possession, setPossession] = useState(() => d('possession', ''));
  const [availableFromMonth, setAvailableFromMonth] = useState(() => d('availableFromMonth', ''));
  const [availableFromYear, setAvailableFromYear] = useState(() => d('availableFromYear', ''));
  const [ageOfConstruction, setAgeOfConstruction] = useState(() => d('ageOfConstruction', ''));
  const [bookingTokenAmount, setBookingTokenAmount] = useState(() => d('bookingTokenAmount', ''));
  const [priceNegotiable, setPriceNegotiable] = useState(() => d('priceNegotiable', false));
  const [cornerPlot, setCornerPlot] = useState(() => d('cornerPlot', false));
  const [boundaryWall, setBoundaryWall] = useState<boolean | undefined>(() =>
    d('boundaryWall', undefined),
  );
  const [plotOpenSides, setPlotOpenSides] = useState(() => d('plotOpenSides', ''));
  const [plotRoadWidthMeters, setPlotRoadWidthMeters] = useState(() =>
    d('plotRoadWidthMeters', ''),
  );
  const [plotConstructionDone, setPlotConstructionDone] = useState<boolean | undefined>(() =>
    d('plotConstructionDone', undefined),
  );
  const [plotGatedColony, setPlotGatedColony] = useState<boolean | undefined>(() =>
    d('plotGatedColony', undefined),
  );
  const [landZone, setLandZone] = useState(() => d('landZone', ''));
  const [privateTerrace, setPrivateTerrace] = useState(() => d('privateTerrace', false));
  const [currentlyLeasedOut, setCurrentlyLeasedOut] = useState<boolean | undefined>(() =>
    d('currentlyLeasedOut', undefined),
  );
  const [entranceWidthFeet, setEntranceWidthFeet] = useState(() => d('entranceWidthFeet', ''));
  const [floorsOffered, setFloorsOffered] = useState(() => d('floorsOffered', ''));
  const [assetStatus, setAssetStatus] = useState(() => d('assetStatus', ''));
  const [paymentComplete, setPaymentComplete] = useState(() => d('paymentComplete', false));
  const [paymentRemaining, setPaymentRemaining] = useState(() => d('paymentRemaining', false));
  const [paymentRemainingPercent, setPaymentRemainingPercent] = useState(() =>
    d('paymentRemainingPercent', ''),
  );
  const [assuredReturn, setAssuredReturn] = useState(() => d('assuredReturn', false));
  const [assuredReturnPercent, setAssuredReturnPercent] = useState(() =>
    d('assuredReturnPercent', ''),
  );
  const [leaseGuarantee, setLeaseGuarantee] = useState(() => d('leaseGuarantee', false));
  const [leaseGuaranteeAmount, setLeaseGuaranteeAmount] = useState(() =>
    d('leaseGuaranteeAmount', ''),
  );
  const [rightsOfUse, setRightsOfUse] = useState(() => d('rightsOfUse', ''));
  const [shopType, setShopType] = useState(() => d('shopType', ''));
  const [idealForBusinesses, setIdealForBusinesses] = useState(() => d('idealForBusinesses', ''));
  const [shopWashrooms, setShopWashrooms] = useState(() => d('shopWashrooms', ''));
  const [cornerShop, setCornerShop] = useState<boolean | undefined>(() =>
    d('cornerShop', undefined),
  );
  const [mainRoadFacing, setMainRoadFacing] = useState<boolean | undefined>(() =>
    d('mainRoadFacing', undefined),
  );
  const [personalWashroom, setPersonalWashroom] = useState<boolean | undefined>(() =>
    d('personalWashroom', undefined),
  );
  const [pantryCafeteria, setPantryCafeteria] = useState(() => d('pantryCafeteria', ''));
  const [propertyHighlights, setPropertyHighlights] = useState(() => d('propertyHighlights', ''));
  const [pricePerSqFt, setPricePerSqFt] = useState(() => d('pricePerSqFt', ''));
  const [photoNote, setPhotoNote] = useState(() => d('photoNote', ''));
  const [published, setPublished] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  // Auto-save the draft so nothing is lost when the user goes to log in / sign up.
  // Blob previews are memory-only — keep ids so files can still upload after login in this tab.
  const draftJson = JSON.stringify({
    step,
    propertyType,
    locality,
    address,
    stateName,
    pincode,
    floor,
    totalFloors,
    bedrooms,
    washrooms,
    balconies,
    kitchens,
    hasServiceRoom,
    hasStudyRoom,
    builtUpArea,
    landSqFt,
    propertyNumber,
    plotWidth,
    plotLength,
    floorsAllowed,
    projectName,
    carpetArea,
    superArea,
    maintenanceCharges,
    verifications,
    verificationUploads: Object.fromEntries(
      Object.entries(verificationUploads).map(([key, upload]) => [
        key,
        upload
          ? {
              ...upload,
              dataUrl: upload.dataUrl?.startsWith('blob:') ? '' : upload.dataUrl,
            }
          : upload,
      ]),
    ),
    propertyPhotos: propertyPhotos.map((photo) => ({
      ...photo,
      dataUrl: photo.dataUrl?.startsWith('blob:') ? '' : photo.dataUrl,
    })),
    propertyVideos: propertyVideos.map((video) => ({
      ...video,
      dataUrl: video.dataUrl?.startsWith('blob:') ? '' : video.dataUrl,
    })),
    furnishing,
    facing,
    parking,
    possession,
    availableFromMonth,
    availableFromYear,
    ageOfConstruction,
    bookingTokenAmount,
    priceNegotiable,
    cornerPlot,
    boundaryWall,
    plotOpenSides,
    plotRoadWidthMeters,
    plotConstructionDone,
    plotGatedColony,
    landZone,
    privateTerrace,
    currentlyLeasedOut,
    entranceWidthFeet,
    floorsOffered,
    assetStatus,
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
    shopWashrooms,
    cornerShop,
    mainRoadFacing,
    personalWashroom,
    pantryCafeteria,
    propertyHighlights,
    pricePerSqFt,
    photoNote,
  });

  useEffect(() => {
    try {
      if (published) {
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        sessionStorage.setItem(DRAFT_KEY, draftJson);
      }
    } catch {
      // Storage full/unavailable — draft simply won't survive a redirect.
    }
  }, [draftJson, published]);

  const progress = ((step + 1) / STEPS.length) * 100;

  const isPlot = isPlotType(propertyType);
  const isResidential = isResidentialUnitType(propertyType);
  const isCommercialUnit = isCommercialUnitType(propertyType);
  const isVilla = isVillaType(propertyType);
  const isBuilderFloor = isBuilderFloorType(propertyType);
  const isPenthouse = isPenthouseType(propertyType);
  const isCommercialShowroom = isCommercialShowroomType(propertyType);
  const isWarehouseGodown = isWarehouseGodownType(propertyType);
  const isIndustrialLand = isIndustrialLandType(propertyType);
  const isIndustrialBuilding = isIndustrialBuildingType(propertyType);
  const isIndustrialShed = isIndustrialShedType(propertyType);
  const isAgriculturalLand = isAgriculturalLandType(propertyType);
  const isFarmHouse = isFarmHouseType(propertyType);
  const isIndustrialUnit = isWarehouseGodown || isIndustrialBuilding || isIndustrialShed;
  const showFloorFields =
    !isPlot &&
    !isCommercialUnit &&
    !isBuilderFloor &&
    !isPenthouse &&
    !isIndustrialUnit &&
    !isFarmHouse &&
    propertyType.length > 0;
  const location = locality.trim() && stateName.trim() ? buildListingLocation(locality, stateName) : '';
  const areaSqFt = getAreaSqFt(isPlot, builtUpArea, landSqFt);
  const totalPrice = getTotalPrice(pricePerSqFt, areaSqFt);

  const detailsSummary = buildListingDetailsSummary({
    isPlot,
    isResidential,
    isCommercialUnit,
    bedrooms,
    washrooms,
    balconies,
    kitchens,
    hasServiceRoom,
    hasStudyRoom,
    builtUpArea,
    landSqFt,
    propertyNumber: propertyNumber || undefined,
    floorsAllowed: floorsAllowed || undefined,
    projectName: projectName || undefined,
    carpetArea: carpetArea || undefined,
    superArea: superArea || undefined,
    privateTerrace: isPenthouse ? privateTerrace : undefined,
    currentlyLeasedOut:
      isCommercialShowroom || isIndustrialUnit || isAgriculturalLand
        ? currentlyLeasedOut
        : undefined,
    entranceWidthFeet: entranceWidthFeet || undefined,
    floorsOffered: floorsOffered || undefined,
    maintenanceCharges: maintenanceCharges || undefined,
    furnishing: furnishing || undefined,
    facing: facing || undefined,
    parking: parking || undefined,
    possession: possession || undefined,
    availableFromMonth: availableFromMonth || undefined,
    availableFromYear: availableFromYear || undefined,
    ageOfConstruction: ageOfConstruction || undefined,
    bookingTokenAmount: bookingTokenAmount || undefined,
    priceNegotiable,
    cornerPlot,
    boundaryWall: boundaryWall === true,
    plotOpenSides: plotOpenSides || undefined,
    plotRoadWidthMeters: plotRoadWidthMeters || undefined,
    plotConstructionDone,
    plotGatedColony,
    landZone: landZone || undefined,
    assetStatus: assetStatus || undefined,
    paymentComplete: isCommercialUnit ? paymentComplete : undefined,
    paymentRemaining: isCommercialUnit ? paymentRemaining : undefined,
    paymentRemainingPercent: paymentRemainingPercent || undefined,
    assuredReturn: isCommercialUnit ? assuredReturn : undefined,
    assuredReturnPercent: assuredReturnPercent || undefined,
    leaseGuarantee: isCommercialUnit ? leaseGuarantee : undefined,
    leaseGuaranteeAmount: leaseGuaranteeAmount || undefined,
    rightsOfUse: rightsOfUse || undefined,
    shopType: shopType || undefined,
    idealForBusinesses: idealForBusinesses || undefined,
    shopFloor: isCommercialUnit ? floor || undefined : undefined,
    shopTotalFloors: isCommercialUnit ? totalFloors || undefined : undefined,
    shopWashrooms: isCommercialUnit ? shopWashrooms || undefined : undefined,
    personalWashroom: isCommercialUnit ? personalWashroom : undefined,
    pantryCafeteria: isCommercialUnit ? pantryCafeteria || undefined : undefined,
    cornerShop: isCommercialUnit ? cornerShop : undefined,
    mainRoadFacing: isCommercialUnit ? mainRoadFacing : undefined,
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
          dataUrl: '',
          storageKey: upload.storageKey,
          uploadedAt: now,
          status: 'pending' as const,
        };
      });
  }

  /** Upload any files picked while logged out to CDN, then return server-backed media. */
  async function flushGuestUploads(): Promise<{
    photos: PropertyPhoto[];
    videos: PropertyVideo[];
    verificationUploads: Partial<Record<VerificationDocType, PendingVerificationUpload>>;
  }> {
    const photos: PropertyPhoto[] = [];
    for (const photo of propertyPhotos) {
      if (photo.storageKey) {
        photos.push(photo);
        continue;
      }
      const file = takeGuestFile(photo.id);
      if (!file) continue;
      const uploaded = await uploadPrivateFile(file, 'photo');
      photos.push({
        ...photo,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        dataUrl: uploaded.url,
        storageKey: uploaded.storageKey,
      });
    }

    const videos: PropertyVideo[] = [];
    for (const video of propertyVideos) {
      if (video.storageKey) {
        videos.push(video);
        continue;
      }
      const file = takeGuestFile(video.id);
      if (!file) continue;
      const uploaded = await uploadPrivateVideo(file);
      videos.push({
        ...video,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        dataUrl: uploaded.url,
        storageKey: uploaded.storageKey,
      });
    }

    const nextUploads: Partial<Record<VerificationDocType, PendingVerificationUpload>> = {
      ...verificationUploads,
    };
    for (const key of Object.keys(nextUploads) as VerificationDocType[]) {
      const upload = nextUploads[key];
      if (!upload?.storageKey?.startsWith('guest-verify-')) continue;
      const file = takeGuestFile(upload.storageKey);
      if (!file) {
        delete nextUploads[key];
        continue;
      }
      const uploaded = await uploadPrivateFile(file, 'kyc');
      nextUploads[key] = {
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        dataUrl: uploaded.url,
        storageKey: uploaded.storageKey,
      };
    }

    return { photos, videos, verificationUploads: nextUploads };
  }

  const verificationLabels = getVerificationBadgeLabels(verifications);
  const pendingVerificationCount = buildVerificationDocuments().length;

  const canContinue = () => {
    if (step === 0) return propertyType.length > 0;
    if (step === 1) {
      return locality.trim().length > 0 && address.trim().length > 0 && stateName.trim().length > 0;
    }
    if (step === 2) {
      if (isPlot) return landSqFt.trim().length > 0;
      if (isWarehouseGodown) {
        return (
          (superArea.trim().length > 0 || builtUpArea.trim().length > 0) &&
          floor.trim().length > 0 &&
          totalFloors.trim().length > 0 &&
          furnishing.trim().length > 0 &&
          possession.trim().length > 0
        );
      }
      if (isIndustrialBuilding) {
        return (
          (superArea.trim().length > 0 || builtUpArea.trim().length > 0) &&
          totalFloors.trim().length > 0 &&
          possession.trim().length > 0
        );
      }
      if (isIndustrialShed) {
        return (
          (superArea.trim().length > 0 || builtUpArea.trim().length > 0) &&
          possession.trim().length > 0
        );
      }
      if (isCommercialUnit) {
        if (isCommercialShowroom) {
          return (
            builtUpArea.trim().length > 0 &&
            floor.trim().length > 0 &&
            totalFloors.trim().length > 0 &&
            furnishing.trim().length > 0 &&
            shopWashrooms.trim().length > 0 &&
            possession.trim().length > 0 &&
            (!assuredReturn || assuredReturnPercent.trim().length > 0)
          );
        }
        return (
          builtUpArea.trim().length > 0 &&
          assetStatus.trim().length > 0 &&
          rightsOfUse.trim().length > 0 &&
          shopType.trim().length > 0 &&
          floor.trim().length > 0 &&
          totalFloors.trim().length > 0 &&
          furnishing.trim().length > 0 &&
          shopWashrooms.trim().length > 0 &&
          (!paymentRemaining || paymentRemainingPercent.trim().length > 0) &&
          (!assuredReturn || assuredReturnPercent.trim().length > 0) &&
          (!leaseGuarantee || leaseGuaranteeAmount.trim().length > 0)
        );
      }
      if (isFarmHouse) {
        return (
          bedrooms > 0 &&
          (superArea.trim().length > 0 || builtUpArea.trim().length > 0) &&
          totalFloors.trim().length > 0 &&
          furnishing.trim().length > 0 &&
          possession.trim().length > 0
        );
      }
      if (isResidential) return bedrooms > 0 && builtUpArea.trim().length > 0;
      return builtUpArea.trim().length > 0;
    }
    if (step === 3) return pricePerSqFt.trim().length > 0;
    if (step === 5) return verificationStepIsValid(verifications, verificationUploads);
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

  const publish = async () => {
    if (!isAuthenticated || !user?.id) {
      // Draft is already saved — send the user to log in / sign up, then they come back here.
      navigate('/list-your-property/login');
      return;
    }

    setPublishError('');
    setPublishing(true);

    try {
      const flushed = await flushGuestUploads();
      setPropertyPhotos(flushed.photos);
      setPropertyVideos(flushed.videos);
      setVerificationUploads(flushed.verificationUploads);

      const sellerId = resolveSellerId(user.id);
      const sellerName = user.name;
      const sellerPhone = user.phone;

      setSellerName(sellerName);
      setSellerPhone(sellerPhone);

      const publishedAt = new Date().toISOString();
      const description = [propertyHighlights.trim(), photoNote.trim()].filter(Boolean).join('\n\n');
      const now = new Date().toISOString();
      const verificationDocuments = VERIFICATION_FIELDS.filter(
        ({ key }) => verifications[key] && flushed.verificationUploads[key],
      ).map(({ key }) => {
        const upload = flushed.verificationUploads[key]!;
        return {
          id: randomId(),
          type: key,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          dataUrl: '',
          storageKey: upload.storageKey,
          uploadedAt: now,
          status: 'pending' as const,
        };
      });
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
        floor:
          (showFloorFields ||
            isCommercialUnit ||
            isBuilderFloor ||
            isPenthouse ||
            isWarehouseGodown) &&
          floor.trim()
            ? floor.trim()
            : undefined,
        totalFloors:
          (showFloorFields ||
            isCommercialUnit ||
            isBuilderFloor ||
            isPenthouse ||
            isWarehouseGodown ||
            isIndustrialBuilding ||
            isFarmHouse) &&
          totalFloors.trim()
            ? totalFloors.trim()
            : undefined,
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
        propertyPhotos: flushed.photos,
        propertyVideos: flushed.videos,
        furnishing: furnishing || undefined,
        facing: facing || undefined,
        parking: parking || undefined,
        possession: possession || undefined,
        availableFromMonth:
          possession === 'Under Construction' && availableFromMonth
            ? availableFromMonth
            : undefined,
        availableFromYear:
          possession === 'Under Construction' && availableFromYear
            ? availableFromYear
            : undefined,
        ageOfConstruction:
          possession === 'Ready to Move' && ageOfConstruction
            ? ageOfConstruction
            : undefined,
        bookingTokenAmount: bookingTokenAmount.trim()
          ? Number(bookingTokenAmount)
          : undefined,
        priceNegotiable,
        cornerPlot: isPlot || isVilla ? cornerPlot : undefined,
        boundaryWall: isPlot && boundaryWall === true ? true : undefined,
        propertyNumber: isPlot && propertyNumber.trim() ? propertyNumber.trim() : undefined,
        plotWidth: isPlot && plotWidth.trim() ? Number(plotWidth) : undefined,
        plotLength: isPlot && plotLength.trim() ? Number(plotLength) : undefined,
        plotAreaSqFt:
          (isVilla || isCommercialShowroom) && landSqFt.trim()
            ? Number(landSqFt)
            : undefined,
        currentlyLeasedOut:
          isCommercialShowroom || isIndustrialUnit || isAgriculturalLand
            ? currentlyLeasedOut
            : undefined,
        entranceWidthFeet:
          isCommercialShowroom && entranceWidthFeet.trim()
            ? Number(entranceWidthFeet)
            : undefined,
        floorsOffered:
          isCommercialShowroom && floorsOffered.trim() ? floorsOffered.trim() : undefined,
        floorsAllowed:
          (isPlot ||
            isVilla ||
            isBuilderFloor ||
            isWarehouseGodown ||
            isIndustrialBuilding ||
            isIndustrialShed ||
            isFarmHouse) &&
          floorsAllowed.trim()
            ? floorsAllowed.trim()
            : undefined,
        projectName: !isPlot && projectName.trim() ? projectName.trim() : undefined,
        carpetArea:
          !isPlot && !isIndustrialUnit && carpetArea.trim()
            ? Number(carpetArea)
            : undefined,
        superArea:
          (isBuilderFloor || isPenthouse || isIndustrialUnit || isFarmHouse) &&
          (superArea.trim() || builtUpArea.trim())
            ? Number(superArea.trim() || builtUpArea)
            : undefined,
        privateTerrace: isPenthouse ? privateTerrace : undefined,
        maintenanceCharges:
          !isPlot && maintenanceCharges.trim() ? Number(maintenanceCharges) : undefined,
        plotOpenSides:
          (isPlot || isVilla || isWarehouseGodown || isIndustrialShed || isFarmHouse) &&
          plotOpenSides
            ? plotOpenSides
            : undefined,
        plotRoadWidthMeters:
          ((isPlot && !isIndustrialLand) || isWarehouseGodown || isFarmHouse) &&
          plotRoadWidthMeters.trim()
            ? Number(plotRoadWidthMeters)
            : undefined,
        plotConstructionDone: isPlot ? plotConstructionDone : undefined,
        plotGatedColony: isPlot ? plotGatedColony : undefined,
        landZone:
          (isPlot || isCommercialUnit || isIndustrialUnit) && landZone.trim()
            ? landZone.trim()
            : undefined,
        assetStatus: isCommercialUnit && assetStatus ? assetStatus : undefined,
        paymentComplete:
          isCommercialUnit && !isCommercialShowroom && paymentComplete ? true : undefined,
        paymentRemaining:
          isCommercialUnit && !isCommercialShowroom && paymentRemaining ? true : undefined,
        paymentRemainingPercent:
          isCommercialUnit &&
          !isCommercialShowroom &&
          paymentRemaining &&
          paymentRemainingPercent.trim()
            ? Number(paymentRemainingPercent)
            : undefined,
        assuredReturn: isCommercialUnit && assuredReturn ? true : undefined,
        assuredReturnPercent:
          isCommercialUnit && assuredReturn && assuredReturnPercent.trim()
            ? Number(assuredReturnPercent)
            : undefined,
        leaseGuarantee:
          isCommercialUnit && !isCommercialShowroom && leaseGuarantee ? true : undefined,
        leaseGuaranteeAmount:
          isCommercialUnit &&
          !isCommercialShowroom &&
          leaseGuarantee &&
          leaseGuaranteeAmount.trim()
            ? Number(leaseGuaranteeAmount)
            : undefined,
        rightsOfUse:
          isCommercialUnit && !isCommercialShowroom && rightsOfUse ? rightsOfUse : undefined,
        shopType:
          isCommercialUnit && !isCommercialShowroom && shopType ? shopType : undefined,
        idealForBusinesses:
          isCommercialUnit && !isCommercialShowroom && idealForBusinesses.trim()
            ? idealForBusinesses.trim()
            : undefined,
        shopWashrooms: isCommercialUnit && shopWashrooms ? shopWashrooms : undefined,
        personalWashroom: isCommercialUnit ? personalWashroom : undefined,
        pantryCafeteria: isCommercialUnit && pantryCafeteria ? pantryCafeteria : undefined,
        cornerShop: isCommercialUnit && cornerShop === true ? true : undefined,
        mainRoadFacing: isCommercialUnit && mainRoadFacing === true ? true : undefined,
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

      const result = await addListing(listing);

      if (!result.ok) {
        setPublishError(result.error);
        return;
      }

      setVerificationSubmitted(hasVerificationDocs);
      setPublished(true);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Could not publish listing.');
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900 dark-theme-page">
        <Header />
        <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Listing published</h1>
            <p className="text-gray-300 mb-4">
              Your {propertyType} is live at <span className="font-semibold text-white">{formatPrice(totalPrice)}</span>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {verificationSubmitted
                ? 'Your documents are under review. Verification badges appear after approval (about 5 seconds in prototype).'
                : 'Anyone can now see it on Browse listings.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/seller/dashboard"
                className="inline-block px-8 py-4 bg-[#FF7A00] text-white rounded-full font-medium hover:bg-[#E66E00] transition-colors"
              >
                Seller dashboard
              </Link>
              <Link
                to="/browse-property"
                className="inline-block px-8 py-4 border border-white/10 text-white rounded-full font-medium hover:bg-white/5 transition-colors"
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
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900 dark-theme-page">
      <Header />
      <main className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <ListingFormShell
          progress={
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Step {step + 1} of {STEPS.length}
                </span>
                <span className="text-xs font-medium text-[#FF7A00]">{STEPS[step]}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF7A00] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 gap-1">
                {STEPS.map((label, i) => (
                  <span
                    key={label}
                    className={`text-[10px] font-medium hidden sm:block ${
                      i <= step ? 'text-[#FF7A00]' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          }
        >
          <div className="min-h-[320px]">
            {step === 0 && (
              <div>
                <Building2 className="text-[#FF7A00] mb-4" size={28} />
                <h1 className="text-3xl font-bold tracking-tight mb-2">Property type</h1>
                <p className="text-gray-600 mb-8">Select what you are listing.</p>
                <PropertyTypeSelect value={propertyType} onChange={setPropertyType} />
              </div>
            )}

            {step === 1 && (
              <SellerLocalityStep
                propertyType={propertyType}
                showFloorFields={showFloorFields}
                showProjectName={!isPlot}
                locality={locality}
                address={address}
                state={stateName}
                pincode={pincode}
                floor={floor}
                totalFloors={totalFloors}
                projectName={projectName}
                onLocalityChange={setLocality}
                onAddressChange={setAddress}
                onStateChange={setStateName}
                onPincodeChange={setPincode}
                onFloorChange={setFloor}
                onTotalFloorsChange={setTotalFloors}
                onProjectNameChange={setProjectName}
              />
            )}

            {step === 2 && (
              <SellerPropertyDetailsStep
                isPlot={isPlot}
                isResidential={isResidential}
                isCommercialUnit={isCommercialUnit}
                isVilla={isVilla}
                isBuilderFloor={isBuilderFloor}
                isPenthouse={isPenthouse}
                isCommercialShowroom={isCommercialShowroom}
                isWarehouseGodown={isWarehouseGodown}
                isIndustrialLand={isIndustrialLand}
                isIndustrialBuilding={isIndustrialBuilding}
                isIndustrialShed={isIndustrialShed}
                isAgriculturalLand={isAgriculturalLand}
                isFarmHouse={isFarmHouse}
                bedrooms={bedrooms}
                washrooms={washrooms}
                balconies={balconies}
                kitchens={kitchens}
                hasServiceRoom={hasServiceRoom}
                hasStudyRoom={hasStudyRoom}
                builtUpArea={builtUpArea}
                landSqFt={landSqFt}
                propertyNumber={propertyNumber}
                plotWidth={plotWidth}
                plotLength={plotLength}
                floorsAllowed={floorsAllowed}
                carpetArea={carpetArea}
                superArea={superArea}
                maintenanceCharges={maintenanceCharges}
                furnishing={furnishing}
                facing={facing}
                parking={parking}
                possession={possession}
                availableFromMonth={availableFromMonth}
                availableFromYear={availableFromYear}
                ageOfConstruction={ageOfConstruction}
                bookingTokenAmount={bookingTokenAmount}
                priceNegotiable={priceNegotiable}
                cornerPlot={cornerPlot}
                boundaryWall={boundaryWall}
                plotOpenSides={plotOpenSides}
                plotRoadWidthMeters={plotRoadWidthMeters}
                plotConstructionDone={plotConstructionDone}
                plotGatedColony={plotGatedColony}
                landZone={landZone}
                privateTerrace={privateTerrace}
                currentlyLeasedOut={currentlyLeasedOut}
                entranceWidthFeet={entranceWidthFeet}
                floorsOffered={floorsOffered}
                assetStatus={assetStatus}
                paymentComplete={paymentComplete}
                paymentRemaining={paymentRemaining}
                paymentRemainingPercent={paymentRemainingPercent}
                assuredReturn={assuredReturn}
                assuredReturnPercent={assuredReturnPercent}
                leaseGuarantee={leaseGuarantee}
                leaseGuaranteeAmount={leaseGuaranteeAmount}
                rightsOfUse={rightsOfUse}
                shopType={shopType}
                idealForBusinesses={idealForBusinesses}
                shopFloor={floor}
                shopTotalFloors={totalFloors}
                shopWashrooms={shopWashrooms}
                cornerShop={cornerShop}
                mainRoadFacing={mainRoadFacing}
                personalWashroom={personalWashroom}
                pantryCafeteria={pantryCafeteria}
                propertyHighlights={propertyHighlights}
                onBedroomsChange={setBedrooms}
                onWashroomsChange={setWashrooms}
                onBalconiesChange={setBalconies}
                onKitchensChange={setKitchens}
                onHasServiceRoomChange={setHasServiceRoom}
                onHasStudyRoomChange={setHasStudyRoom}
                onBuiltUpAreaChange={setBuiltUpArea}
                onLandSqFtChange={setLandSqFt}
                onPropertyNumberChange={setPropertyNumber}
                onPlotWidthChange={setPlotWidth}
                onPlotLengthChange={setPlotLength}
                onFloorsAllowedChange={setFloorsAllowed}
                onCarpetAreaChange={setCarpetArea}
                onSuperAreaChange={setSuperArea}
                onMaintenanceChargesChange={setMaintenanceCharges}
                onFurnishingChange={setFurnishing}
                onFacingChange={setFacing}
                onParkingChange={setParking}
                onPossessionChange={setPossession}
                onAvailableFromMonthChange={setAvailableFromMonth}
                onAvailableFromYearChange={setAvailableFromYear}
                onAgeOfConstructionChange={setAgeOfConstruction}
                onBookingTokenAmountChange={setBookingTokenAmount}
                onPriceNegotiableChange={setPriceNegotiable}
                onCornerPlotChange={setCornerPlot}
                onBoundaryWallChange={setBoundaryWall}
                onPlotOpenSidesChange={setPlotOpenSides}
                onPlotRoadWidthMetersChange={setPlotRoadWidthMeters}
                onPlotConstructionDoneChange={setPlotConstructionDone}
                onPlotGatedColonyChange={setPlotGatedColony}
                onLandZoneChange={setLandZone}
                onPrivateTerraceChange={setPrivateTerrace}
                onCurrentlyLeasedOutChange={setCurrentlyLeasedOut}
                onEntranceWidthFeetChange={setEntranceWidthFeet}
                onFloorsOfferedChange={setFloorsOffered}
                onAssetStatusChange={setAssetStatus}
                onPaymentCompleteChange={setPaymentComplete}
                onPaymentRemainingChange={setPaymentRemaining}
                onPaymentRemainingPercentChange={setPaymentRemainingPercent}
                onAssuredReturnChange={setAssuredReturn}
                onAssuredReturnPercentChange={setAssuredReturnPercent}
                onLeaseGuaranteeChange={setLeaseGuarantee}
                onLeaseGuaranteeAmountChange={setLeaseGuaranteeAmount}
                onRightsOfUseChange={setRightsOfUse}
                onShopTypeChange={setShopType}
                onIdealForBusinessesChange={setIdealForBusinesses}
                onShopFloorChange={setFloor}
                onShopTotalFloorsChange={setTotalFloors}
                onShopWashroomsChange={setShopWashrooms}
                onCornerShopChange={setCornerShop}
                onMainRoadFacingChange={setMainRoadFacing}
                onPersonalWashroomChange={setPersonalWashroom}
                onPantryCafeteriaChange={setPantryCafeteria}
                onPropertyHighlightsChange={setPropertyHighlights}
              />
            )}

            {step === 3 && (
              <div>
                <IndianRupee className="text-[#FF7A00] mb-4" size={28} />
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

            {step === 4 && (
              <SellerPhotosStep
                photos={propertyPhotos}
                videos={propertyVideos}
                photoNote={photoNote}
                onPhotosChange={setPropertyPhotos}
                onVideosChange={setPropertyVideos}
                onPhotoNoteChange={setPhotoNote}
                canUploadToServer={isAuthenticated}
              />
            )}

            {step === 5 && (
              <SellerVerificationStep
                verifications={verifications}
                uploads={verificationUploads}
                onVerificationsChange={setVerifications}
                onUploadChange={setVerificationUpload}
                canUploadToServer={isAuthenticated}
              />
            )}

            {step === 6 && (
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Ready to publish?</h1>
                <p className="text-gray-400 mb-8">Quick review before going live.</p>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Listing as</span>
                    <span className="font-semibold">{role} · {intent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Property type</span>
                    <span className="font-semibold text-right max-w-[60%]">{propertyType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Location</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {locality}, {stateName}
                    </span>
                  </div>
                  {!isPlot && projectName.trim() && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500 shrink-0">Project / Society</span>
                      <span className="font-semibold text-right max-w-[60%]">{projectName}</span>
                    </div>
                  )}
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
                  <div className="flex justify-between">
                    <span className="text-gray-500">Video</span>
                    <span className="font-semibold text-right max-w-[60%]">
                      {propertyVideos.length > 0 ? '1 uploaded' : 'None'}
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
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/10 text-gray-300 font-medium hover:bg-white/10 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <Link
                to="/"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-white/10 text-gray-300 font-medium hover:bg-white/10 hover:text-white transition-colors"
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
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF7A00] text-white rounded-full font-medium text-lg hover:bg-[#E66E00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void publish()}
                disabled={publishing}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF7A00] text-white rounded-full font-medium text-lg hover:bg-[#E66E00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {publishing ? 'Saving…' : 'Publish listing'}
                {!publishing && <Check size={18} />}
              </button>
            )}
          </div>
          {publishError && (
            <p className="mt-4 text-sm text-red-400 text-center">{publishError}</p>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={next}
              className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Skip photos for now
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={skipVerification}
              className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Skip this step
            </button>
          )}
        </ListingFormShell>
      </main>
    </div>
  );
}
