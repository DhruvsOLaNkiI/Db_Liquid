import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.');

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters.');

const nonEmptyString = (message: string) => z.string().trim().min(1, message);

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required.'),
  })
  .strict();

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: nonEmptyString('Enter your name.'),
    phone: nonEmptyString('Enter your phone number.'),
  })
  .strict();

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  });

export const recordViewBodySchema = z
  .object({
    visitorId: nonEmptyString('visitorId is required.'),
    viewerUserId: z.string().trim().optional(),
  })
  .strict();

export const placeBidBodySchema = z
  .object({
    bidTotal: z.number().finite().positive('Bid amount must be greater than 0.'),
    idempotencyKey: z
      .string()
      .trim()
      .uuid('idempotencyKey must be a valid UUID.'),
  })
  .strict();

export const acceptBidBodySchema = z
  .object({
    bidId: nonEmptyString('bidId is required.'),
  })
  .strict();

export const declineAcceptedBidBodySchema = z.object({}).strict();

export const reviewVerificationBodySchema = z
  .object({
    listingId: nonEmptyString('listingId is required.'),
    documentId: nonEmptyString('documentId is required.'),
    status: z.enum(['approved', 'rejected']),
  })
  .strict();

export const reviewKycBodySchema = z
  .object({
    userId: nonEmptyString('userId is required.'),
    field: z.enum(['aadhar', 'pan']),
    verified: z.boolean(),
  })
  .strict();

const creditHistoryEntrySchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    credits: z.number().optional(),
    balanceAfter: z.number().optional(),
    note: z.string().optional(),
    listingId: z.string().optional(),
    amountInr: z.number().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export const patchCurrentUserBodySchema = z
  .object({
    email: emailSchema.optional(),
    phone: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    profileImageUrl: z.union([z.string(), z.null()]).optional(),
    aadharNumber: z.union([z.string(), z.null()]).optional(),
    aadharVerified: z.boolean().optional(),
    panNumber: z.union([z.string(), z.null()]).optional(),
    panVerified: z.boolean().optional(),
    credits: z.number().finite().nonnegative().optional(),
    creditHistory: z.array(creditHistoryEntrySchema).optional(),
  })
  .strict();

/** Bulk user array — each entry must have an id; other fields passthrough for admin merge. */
export const adminUsersBodySchema = z
  .array(
    z
      .object({
        id: nonEmptyString('User id is required.'),
      })
      .passthrough(),
  )
  .max(5_000, 'Too many users in one request.');

/** Bulk listings array — each entry must have an id; other fields passthrough for sync/merge. */
export const listingsArrayBodySchema = z
  .array(
    z
      .object({
        id: nonEmptyString('Listing id is required.'),
      })
      .passthrough(),
  )
  .max(5_000, 'Too many listings in one request.');

export const uploadBodySchema = z
  .object({
    fileName: nonEmptyString('fileName is required.'),
    mimeType: nonEmptyString('mimeType is required.'),
    data: nonEmptyString('data is required.'),
    purpose: z.string().trim().max(40).optional(),
  })
  .strict();
