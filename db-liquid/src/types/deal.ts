export type ChatMessage = {
  id: string;
  senderRole: 'seller' | 'buyer';
  senderName: string;
  text: string;
  createdAt: string;
};

export type TokenStatus = 'none' | 'pending' | 'paid' | 'skipped';

export const TOKEN_AMOUNT = 100000;
export const TOKEN_TO_SELLER = 75000;
export const TOKEN_PLATFORM_FEE = 25000;
