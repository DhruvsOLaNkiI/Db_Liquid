import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Bid, PropertyListing, VerificationDocument } from '../types/listing';
import { getAcceptedBid, getMinNextBid, isBiddingOpen, isBuyerTokenDue, normalizeListing } from '../types/listing';
import { buildApprovedVerifications } from '../utils/listingDisplay';
import {
  appendListingToStorage,
  LISTINGS_STORAGE_KEY,
  loadListingsFromStorage,
  saveListingsToStorage,
  sortListingsByNewest,
} from '../utils/listingsStorage';
import { randomId } from '../utils/randomId';
import { spendBidCredit } from '../utils/buyerCredits';
import { DATA_REFRESH_EVENT } from '../utils/sharedStore';

export { LISTINGS_STORAGE_KEY } from '../utils/listingsStorage';

type ActionResult =
  | { ok: true; creditsRemaining?: number }
  | { ok: false; error: string };

type ListingsContextValue = {
  listings: PropertyListing[];
  reloadListings: () => void;
  addListing: (listing: PropertyListing) => void;
  placeBid: (
    listingId: string,
    bidderName: string,
    bidderPhone: string,
    amountPerSqFt: number,
    buyerUserId: string,
  ) => Promise<ActionResult>;
  acceptBid: (listingId: string, bidId: string, sellerId: string) => ActionResult;
  proceedDeal: (listingId: string, sellerId: string) => ActionResult;
  completeToken: (
    listingId: string,
    buyerUserId: string,
    buyerName: string,
    buyerPhone: string,
    action: 'pay' | 'skip',
  ) => ActionResult;
  declineAcceptedBuyer: (listingId: string, sellerId: string) => ActionResult;
  sendChatMessage: (
    listingId: string,
    senderRole: 'seller' | 'buyer',
    text: string,
    sellerId?: string,
  ) => ActionResult;
  getListingById: (id: string) => PropertyListing | undefined;
  getSellerListings: (sellerId: string) => PropertyListing[];
};

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<PropertyListing[]>(() =>
    sortListingsByNewest(loadListingsFromStorage()),
  );

  const reloadListings = useCallback(async () => {
    const { reloadListingsFromServer } = await import('../utils/sharedStore');
    const data = await reloadListingsFromServer();
    setListings(sortListingsByNewest(data));
  }, []);

  useEffect(() => {
    void reloadListings();
    const interval = window.setInterval(() => void reloadListings(), 5000);
    return () => window.clearInterval(interval);
  }, [reloadListings]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== LISTINGS_STORAGE_KEY) return;
      void reloadListings();
    };

    const onDataRefresh = () => void reloadListings();

    window.addEventListener('storage', onStorage);
    window.addEventListener(DATA_REFRESH_EVENT, onDataRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(DATA_REFRESH_EVENT, onDataRefresh);
    };
  }, [reloadListings]);

  const updateListings = (updater: (prev: PropertyListing[]) => PropertyListing[]) => {
    setListings((prev) => saveListingsToStorage(updater(prev)));
  };

  const addListing = (listing: PropertyListing) => {
    const normalized = normalizeListing(listing);
    const saved = appendListingToStorage(normalized);
    setListings(saved);

    if (normalized.verificationReviewStatus === 'pending' && normalized.verificationDocuments?.length) {
      window.setTimeout(() => {
        updateListings((prev) =>
          prev.map((item) => {
            if (item.id !== normalized.id) return item;

            const reviewedAt = new Date().toISOString();
            const verificationDocuments: VerificationDocument[] = (item.verificationDocuments ?? []).map(
              (doc) => ({
                ...doc,
                status: 'approved',
                reviewedAt,
              }),
            );
            const approvedCount = verificationDocuments.filter((doc) => doc.status === 'approved').length;

            return {
              ...item,
              verificationDocuments,
              verificationReviewStatus:
                approvedCount === verificationDocuments.length ? 'approved' : 'partial',
              verifications: buildApprovedVerifications(verificationDocuments),
            };
          }),
        );
      }, 5000);
    }
  };

  const getListingById = (id: string) => listings.find((l) => l.id === id);

  const getSellerListings = (sellerId: string) =>
    listings.filter((l) => l.sellerId === sellerId);

  const placeBid = async (
    listingId: string,
    bidderName: string,
    bidderPhone: string,
    amountPerSqFt: number,
    buyerUserId: string,
  ): Promise<ActionResult> => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (listing.acceptedBidId) return { ok: false, error: 'A bid has already been accepted.' };
    if (!isBiddingOpen(listing)) return { ok: false, error: 'Bidding has closed for this property.' };

    const name = bidderName.trim();
    const phone = bidderPhone.trim();
    if (!name) return { ok: false, error: 'Enter your name.' };
    if (!phone) return { ok: false, error: 'Enter your phone number.' };
    if (!buyerUserId) {
      return { ok: false, error: 'Log in as a buyer and top up credits to place a bid.' };
    }

    const minBid = getMinNextBid(listing);
    if (amountPerSqFt < minBid) {
      return { ok: false, error: `Minimum bid is ₹${minBid.toLocaleString('en-IN')}/sq.ft` };
    }

    const creditResult = await spendBidCredit(buyerUserId, {
      listingId,
      note: `Bid on ${listing.location}`,
    });
    if (!creditResult.ok) return creditResult;

    const bid: Bid = {
      id: randomId(),
      bidderName: name,
      bidderPhone: phone,
      bidderUserId: buyerUserId,
      amountPerSqFt,
      createdAt: new Date().toISOString(),
    };

    updateListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, bids: [bid, ...l.bids] } : l)),
    );

    return { ok: true, creditsRemaining: creditResult.credits };
  };

  const acceptBid = (listingId: string, bidId: string, sellerId: string): ActionResult => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (listing.sellerId !== sellerId) return { ok: false, error: 'Not your listing.' };
    if (listing.acceptedBidId) return { ok: false, error: 'A bid has already been accepted.' };

    const bid = listing.bids.find((b) => b.id === bidId);
    if (!bid) return { ok: false, error: 'Bid not found.' };

    updateListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? {
              ...l,
              acceptedBidId: bidId,
              acceptedAt: new Date().toISOString(),
              proceededAt: new Date().toISOString(),
              tokenStatus: 'pending',
            }
          : l,
      ),
    );

    return { ok: true };
  };

  const proceedDeal = (listingId: string, sellerId: string): ActionResult => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (listing.sellerId !== sellerId) return { ok: false, error: 'Not your listing.' };
    if (!listing.acceptedBidId) return { ok: false, error: 'Accept a bid first.' };
    if (listing.proceededAt) return { ok: false, error: 'Already proceeded.' };

    updateListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? { ...l, proceededAt: new Date().toISOString(), tokenStatus: 'pending' }
          : l,
      ),
    );

    return { ok: true };
  };

  const completeToken = (
    listingId: string,
    buyerUserId: string,
    buyerName: string,
    buyerPhone: string,
    action: 'pay' | 'skip',
  ): ActionResult => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (!isBuyerTokenDue(listing)) return { ok: false, error: 'Token step not active.' };

    const acceptedBid = getAcceptedBid(listing);
    if (!acceptedBid) return { ok: false, error: 'No accepted bid found.' };

    if (acceptedBid.bidderUserId) {
      if (acceptedBid.bidderUserId !== buyerUserId) {
        return { ok: false, error: 'Only the accepted buyer can pay the token.' };
      }
    } else if (
      acceptedBid.bidderName !== buyerName.trim() ||
      acceptedBid.bidderPhone !== buyerPhone.trim()
    ) {
      return { ok: false, error: 'Only the accepted buyer can pay the token.' };
    }

    updateListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? {
              ...l,
              proceededAt: l.proceededAt ?? new Date().toISOString(),
              tokenStatus: action === 'pay' ? 'paid' : 'skipped',
              chatSellerName: l.sellerName,
              chatSellerPhone: l.sellerPhone,
              chatBuyerName: acceptedBid.bidderName,
              chatBuyerPhone: acceptedBid.bidderPhone,
            }
          : l,
      ),
    );

    return { ok: true };
  };

  const declineAcceptedBuyer = (listingId: string, sellerId: string): ActionResult => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (listing.sellerId !== sellerId) return { ok: false, error: 'Not your listing.' };
    if (!listing.acceptedBidId) return { ok: false, error: 'No accepted bid to decline.' };

    const acceptedBid = getAcceptedBid(listing);
    if (!acceptedBid) return { ok: false, error: 'Accepted bid not found.' };

    updateListings((prev) =>
      prev.map((l) => {
        if (l.id !== listingId) return l;
        return {
          ...l,
          bids: l.bids.filter((bid) => bid.id !== acceptedBid.id),
          acceptedBidId: null,
          acceptedAt: null,
          proceededAt: null,
          tokenStatus: 'none',
          chatMessages: [],
          chatSellerName: '',
          chatSellerPhone: '',
          chatBuyerName: '',
          chatBuyerPhone: '',
          lastDeclinedBuyerUserId: acceptedBid.bidderUserId,
          lastDeclinedAt: new Date().toISOString(),
        };
      }),
    );

    return { ok: true };
  };

  const sendChatMessage = (
    listingId: string,
    senderRole: 'seller' | 'buyer',
    text: string,
    sellerId?: string,
  ): ActionResult => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: 'Listing not found.' };
    if (listing.tokenStatus !== 'paid' && listing.tokenStatus !== 'skipped') {
      return { ok: false, error: 'Complete token step to start chatting.' };
    }

    if (senderRole === 'seller' && sellerId && listing.sellerId !== sellerId) {
      return { ok: false, error: 'Not authorized.' };
    }

    const trimmed = text.trim();
    if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

    const senderName =
      senderRole === 'seller' ? listing.chatSellerName : listing.chatBuyerName;

    const message = {
      id: randomId(),
      senderRole,
      senderName,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    updateListings((prev) =>
      prev.map((l) =>
        l.id === listingId ? { ...l, chatMessages: [...l.chatMessages, message] } : l,
      ),
    );

    return { ok: true };
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        reloadListings,
        addListing,
        placeBid,
        acceptBid,
        proceedDeal,
        completeToken,
        declineAcceptedBuyer,
        sendChatMessage,
        getListingById,
        getSellerListings,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}
