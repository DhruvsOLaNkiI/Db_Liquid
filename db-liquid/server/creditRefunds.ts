import { randomUUID } from 'node:crypto';

export const CREDIT_COST_PER_BID = 1;

type UserRecord = {
  id: string;
  credits?: number;
  creditHistory?: unknown[];
};

/**
 * BID-012 policy (simulated credits):
 * - Placing a bid spends 1 credit.
 * - Seller declines an accepted buyer → refund that buyer's 1 credit.
 * - Auction expires/closes with no accepted bid → refund 1 credit per unrefunded bid.
 * - Winning/accepted deal (not declined) → no automatic refund of the bid credit.
 * - Real payment gateway refunds (BID-011) are deferred with simulated credits.
 */
export function refundBidCreditToUser(
  user: UserRecord,
  input: {
    listingId: string;
    bidId: string;
    note: string;
  },
) {
  const nextCredits = Number(user.credits ?? 0) + CREDIT_COST_PER_BID;
  user.credits = nextCredits;
  const history = Array.isArray(user.creditHistory) ? user.creditHistory : [];
  user.creditHistory = [
    {
      id: randomUUID(),
      type: 'refund',
      credits: CREDIT_COST_PER_BID,
      balanceAfter: nextCredits,
      note: input.note,
      listingId: input.listingId,
      bidId: input.bidId,
      createdAt: new Date().toISOString(),
    },
    ...history,
  ].slice(0, 50);
  return nextCredits;
}
