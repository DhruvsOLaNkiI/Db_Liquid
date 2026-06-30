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
  /** Base64 or URL for profile avatar */
  profileImageUrl?: string;
}

export interface AuthSession {
  userId: string;
  activeRole: UserRole;
}
