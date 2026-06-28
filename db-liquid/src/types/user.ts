import type { CreditTransaction } from './credits';

export type UserRole = 'buyer' | 'seller';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  roles: UserRole[];
  createdAt: string;
  /** Buyer bid credits. 1 credit spent per bid. */
  credits?: number;
  creditHistory?: CreditTransaction[];
}

export interface AuthSession {
  userId: string;
  activeRole: UserRole;
}
