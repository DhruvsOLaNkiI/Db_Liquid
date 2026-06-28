import type { CreditTransaction } from '../types/credits';
import type { User } from '../types/user';
import { randomId } from './randomId';

const MAX_HISTORY = 50;

export function getUserCreditHistory(userId: string, users: User[]): CreditTransaction[] {
  const user = users.find((u) => u.id === userId);
  if (!user?.creditHistory) return [];
  return [...user.creditHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function appendCreditHistory(
  user: User,
  entry: Omit<CreditTransaction, 'id' | 'createdAt'>,
): CreditTransaction[] {
  const tx: CreditTransaction = {
    ...entry,
    id: randomId(),
    createdAt: new Date().toISOString(),
  };
  const history = [tx, ...(user.creditHistory ?? [])].slice(0, MAX_HISTORY);
  user.creditHistory = history;
  return history;
}

export function getCreditsAdded(history: CreditTransaction[]) {
  return history.filter((t) => t.type === 'purchase');
}

export function getCreditsSpent(history: CreditTransaction[]) {
  return history.filter((t) => t.type === 'spend');
}
