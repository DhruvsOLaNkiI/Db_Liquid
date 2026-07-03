type VisitorVisits = Record<string, number>;

type ListingRecord = Record<string, unknown> & {
  sellerId?: string;
  viewCount?: number;
  uniqueVisitorCount?: number;
  returnVisitorCount?: number;
  visitorVisits?: VisitorVisits;
};

export function applyListingView(
  listing: ListingRecord,
  visitorId: string,
  viewerUserId?: string,
) {
  if (viewerUserId && listing.sellerId === viewerUserId) {
    return null;
  }

  const visitorVisits: VisitorVisits = { ...(listing.visitorVisits ?? {}) };
  const previousVisits = visitorVisits[visitorId] ?? 0;
  const nextVisits = previousVisits + 1;
  visitorVisits[visitorId] = nextVisits;

  let viewCount = (listing.viewCount ?? 0) + 1;
  let uniqueVisitorCount = listing.uniqueVisitorCount ?? 0;
  let returnVisitorCount = listing.returnVisitorCount ?? 0;

  if (previousVisits === 0) {
    uniqueVisitorCount += 1;
  } else if (previousVisits === 1) {
    returnVisitorCount += 1;
  }

  return {
    ...listing,
    viewCount,
    uniqueVisitorCount,
    returnVisitorCount,
    visitorVisits,
  };
}

export function mergeViewAnalytics(existing: ListingRecord, incoming: ListingRecord) {
  const existingVisits = existing.visitorVisits ?? {};
  const incomingVisits = incoming.visitorVisits ?? {};
  const visitorVisits: VisitorVisits = { ...existingVisits };

  for (const [visitorId, count] of Object.entries(incomingVisits)) {
    visitorVisits[visitorId] = Math.max(visitorVisits[visitorId] ?? 0, count);
  }

  const uniqueVisitorCount = Object.keys(visitorVisits).length;
  const returnVisitorCount = Object.values(visitorVisits).filter((count) => count >= 2).length;
  const viewCount = Math.max(
    existing.viewCount ?? 0,
    incoming.viewCount ?? 0,
    Object.values(visitorVisits).reduce((sum, count) => sum + count, 0),
  );

  return {
    viewCount,
    uniqueVisitorCount,
    returnVisitorCount,
    visitorVisits,
  };
}
