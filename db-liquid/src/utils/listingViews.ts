const VISITOR_ID_KEY = 'db-liquid-visitor-id';

export function getOrCreateVisitorId() {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

export type RecordViewResult = {
  viewCount: number;
  uniqueVisitorCount: number;
  returnVisitorCount: number;
};

export async function recordListingView(
  listingId: string,
  viewerUserId?: string,
): Promise<
  { ok: true; recorded: false } | { ok: true; recorded: true; stats: RecordViewResult } | { ok: false; error: string }
> {
  const sessionKey = `db-liquid-viewed-${listingId}`;
  if (sessionStorage.getItem(sessionKey)) {
    return { ok: true, recorded: false };
  }

  const visitorId = getOrCreateVisitorId();
  const res = await fetch(`/api/listings/${listingId}/record-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, viewerUserId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Failed to record view.' };
  }

  sessionStorage.setItem(sessionKey, '1');
  return {
    ok: true,
    recorded: true,
    stats: {
      viewCount: data.viewCount ?? 0,
      uniqueVisitorCount: data.uniqueVisitorCount ?? 0,
      returnVisitorCount: data.returnVisitorCount ?? 0,
    },
  };
}
