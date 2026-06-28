/** Default credits shown when opening top-up. */
export const DEFAULT_TOP_UP_CREDITS = 5;

/** Legacy alias — default pack size. */
export const CREDITS_PER_TOP_UP = DEFAULT_TOP_UP_CREDITS;

/** Each bid costs 1 credit (every bid, including on the same property). */
export const CREDIT_COST_PER_BID = 1;

/** +/- buttons change purchase amount by this many credits. */
export const TOP_UP_CREDIT_STEP = 5;

export const MIN_TOP_UP_CREDITS = TOP_UP_CREDIT_STEP;
export const MAX_TOP_UP_CREDITS = 50;

/** Price per bid credit in INR (prototype). */
export const PRICE_PER_CREDIT_INR = 100;

export type CreditTransactionType = 'purchase' | 'spend';

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  credits: number;
  balanceAfter: number;
  note: string;
  amountInr?: number;
  listingId?: string;
  createdAt: string;
}

export function getTopUpPrice(creditCount: number) {
  return creditCount * PRICE_PER_CREDIT_INR;
}

export function formatCreditPrice(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
