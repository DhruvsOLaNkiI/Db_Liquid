import type { Bid, PropertyListing } from '../types/listing';
import type { User } from '../types/user';
import { countUserBidsOnListing } from './buyerCredits';

export type ProfileCompletionCheck = {
  key: 'name' | 'email' | 'phone' | 'profileImage';
  label: string;
  done: boolean;
};

export type UserBidSummary = {
  listingId: string;
  location: string;
  propertyType: string;
  areaSqFt: number;
  bidCount: number;
  latestBid: Bid;
  highestUserBidPerSqFt: number;
};

export type UserChatSummary = {
  listingId: string;
  location: string;
  propertyType: string;
  role: 'buyer' | 'seller';
  messageCount: number;
  lastMessageText: string;
  lastMessageAt: string;
  chatPath: string;
};

export function getProfileCompletion(user: User) {
  const checks: ProfileCompletionCheck[] = [
    { key: 'name', label: 'Full name', done: Boolean(user.name?.trim()) },
    { key: 'email', label: 'Email address', done: Boolean(user.email?.trim()) },
    { key: 'phone', label: 'Phone number', done: Boolean(user.phone?.trim()) },
    { key: 'profileImage', label: 'Profile photo', done: Boolean(user.profileImageUrl) },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((doneCount / checks.length) * 100),
    checks,
  };
}

export function getTotalUserBids(listings: PropertyListing[], userId: string) {
  return listings.reduce((sum, listing) => sum + countUserBidsOnListing(listing.bids, userId), 0);
}

export function getUserBidSummaries(listings: PropertyListing[], userId: string): UserBidSummary[] {
  return listings
    .map((listing) => {
      const userBids = listing.bids.filter((bid) => bid.bidderUserId === userId);
      if (userBids.length === 0) return null;

      const latestBid = userBids.reduce((latest, bid) =>
        new Date(bid.createdAt).getTime() > new Date(latest.createdAt).getTime() ? bid : latest,
      );

      return {
        listingId: listing.id,
        location: listing.location,
        propertyType: listing.propertyType,
        areaSqFt: listing.areaSqFt,
        bidCount: userBids.length,
        latestBid,
        highestUserBidPerSqFt: Math.max(...userBids.map((bid) => bid.amountPerSqFt)),
      };
    })
    .filter((item): item is UserBidSummary => item !== null)
    .sort(
      (a, b) =>
        new Date(b.latestBid.createdAt).getTime() - new Date(a.latestBid.createdAt).getTime(),
    );
}

export function getUserListings(listings: PropertyListing[], userId: string) {
  return listings
    .filter((listing) => listing.sellerId === userId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function isUserChatParticipant(listing: PropertyListing, user: User) {
  if (listing.sellerId === user.id) return 'seller' as const;

  const acceptedBid = listing.acceptedBidId
    ? listing.bids.find((bid) => bid.id === listing.acceptedBidId)
    : null;

  if (acceptedBid?.bidderUserId === user.id) return 'buyer' as const;

  if (
    listing.chatBuyerName &&
    listing.chatBuyerPhone &&
    listing.chatBuyerName === user.name &&
    listing.chatBuyerPhone === user.phone
  ) {
    return 'buyer' as const;
  }

  return null;
}

export function getUserChatSummaries(listings: PropertyListing[], user: User): UserChatSummary[] {
  return listings
    .map((listing) => {
      if (listing.chatMessages.length === 0) return null;

      const role = isUserChatParticipant(listing, user);
      if (!role) return null;

      const lastMessage = listing.chatMessages[listing.chatMessages.length - 1];

      return {
        listingId: listing.id,
        location: listing.location,
        propertyType: listing.propertyType,
        role,
        messageCount: listing.chatMessages.length,
        lastMessageText: lastMessage.text,
        lastMessageAt: lastMessage.createdAt,
        chatPath: role === 'seller' ? `/seller/chat/${listing.id}` : `/deal/${listing.id}/chat`,
      };
    })
    .filter((item): item is UserChatSummary => item !== null)
    .sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
}
