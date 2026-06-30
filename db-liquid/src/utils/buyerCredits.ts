import type { User } from '../types/user';
import { CREDIT_COST_PER_BID } from '../types/credits';
import { getSharedUsers, mutateUsers } from '../utils/sharedStore';
import { appendCreditHistory } from './creditTransactions';
import { getTopUpPrice } from '../types/credits';

export function normalizeUser(raw: Partial<User> & Pick<User, 'id' | 'email' | 'phone' | 'name' | 'password' | 'roles' | 'createdAt'>): User {
  const isBuyer = raw.roles?.includes('buyer');
  return {
    id: raw.id,
    email: raw.email,
    phone: raw.phone,
    name: raw.name,
    password: raw.password,
    roles: raw.roles,
    createdAt: raw.createdAt,
    credits: isBuyer ? (raw.credits ?? 0) : raw.credits,
    creditHistory: raw.creditHistory ?? [],
    profileImageUrl: raw.profileImageUrl,
  };
}

export function getBuyerCredits(userId: string): number {
  const user = getSharedUsers().find((u) => u.id === userId);
  if (!user?.roles.includes('buyer')) return 0;
  return user.credits ?? 0;
}

export function getBuyerCreditHistory(userId: string) {
  const user = getSharedUsers().find((u) => u.id === userId);
  return user?.creditHistory ?? [];
}

export async function topUpCredits(
  userId: string,
  creditAmount: number,
): Promise<{ ok: true; credits: number; added: number } | { ok: false; error: string }> {
  if (!Number.isInteger(creditAmount) || creditAmount < 1) {
    return { ok: false, error: 'Select at least 1 credit to purchase.' };
  }

  const amountInr = getTopUpPrice(creditAmount);

  const result = await mutateUsers((users) => {
    const normalized = users.map((u) => normalizeUser(u as User));
    const index = normalized.findIndex((u) => u.id === userId);
    if (index === -1) return { ok: false, error: 'User not found.' };

    const user = normalized[index];
    if (!user.roles.includes('buyer')) {
      return { ok: false, error: 'Only buyers can top up credits.' };
    }

    user.credits = (user.credits ?? 0) + creditAmount;
    appendCreditHistory(user, {
      type: 'purchase',
      credits: creditAmount,
      balanceAfter: user.credits,
      note: `Purchased ${creditAmount} credit${creditAmount !== 1 ? 's' : ''}`,
      amountInr,
    });
    normalized[index] = user;
    return { ok: true, value: user.credits, users: normalized };
  });

  if (result.ok === false) {
    return result;
  }
  return { ok: true as const, credits: result.value, added: creditAmount };
}

export async function spendBidCredit(
  userId: string,
  meta?: { listingId?: string; note?: string },
): Promise<{ ok: true; credits: number } | { ok: false; error: string }> {
  const result = await mutateUsers((users) => {
    const normalized = users.map((u) => normalizeUser(u as User));
    const index = normalized.findIndex((u) => u.id === userId);
    if (index === -1) return { ok: false, error: 'User not found.' };

    const user = normalized[index];
    if (!user.roles.includes('buyer')) {
      return { ok: false, error: 'Only buyers can spend bid credits.' };
    }

    const balance = user.credits ?? 0;
    if (balance < CREDIT_COST_PER_BID) {
      return {
        ok: false,
        error: `Not enough credits. You need ${CREDIT_COST_PER_BID} credit per bid. Top up to add more credits.`,
      };
    }

    user.credits = balance - CREDIT_COST_PER_BID;
    appendCreditHistory(user, {
      type: 'spend',
      credits: CREDIT_COST_PER_BID,
      balanceAfter: user.credits,
      note: meta?.note ?? 'Bid placed',
      listingId: meta?.listingId,
    });
    normalized[index] = user;
    return { ok: true, value: user.credits, users: normalized };
  });

  if (result.ok === false) {
    return result;
  }
  return { ok: true as const, credits: result.value };
}

export function countUserBidsOnListing(listingBids: { bidderUserId?: string }[], userId: string) {
  return listingBids.filter((b) => b.bidderUserId === userId).length;
}
