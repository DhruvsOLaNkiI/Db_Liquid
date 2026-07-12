import type { CreditTransaction } from './credits';

export type UserRole = 'buyer' | 'seller' | 'admin';

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
  /** Signed URL or legacy base64 for display */
  profileImageUrl?: string;
  /** R2/S3 storage key — send this when saving profile photo */
  profileImageKey?: string;
  /** 12-digit Aadhar number */
  aadharNumber?: string;
  aadharVerified?: boolean;
  /** PAN in ABCDE1234F format */
  panNumber?: string;
  panVerified?: boolean;
}
