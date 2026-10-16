import { z } from 'zod';

export const searchQuerySchema = z.object({
  city: z.string().trim().max(100).optional(),
  locality: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(100).optional(),
  language: z.string().trim().max(50).optional(),
  maxFeeMinor: z.coerce.number().int().nonnegative().optional(),
  providerType: z.enum(['doctor', 'clinic', 'hospital', 'diagnostic_center']).optional(),
  verificationStatus: z.enum(['verified', 'verification_pending', 'unverified', 'suspended']).optional(),
  query: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ValidatedSearchQuery = z.infer<typeof searchQuerySchema>;

export const aiSearchIntentSchema = z.object({
  location: z.string().trim().max(100).optional().nullable(),
  specialty: z.string().trim().max(100).optional().nullable(),
  languages: z.array(z.string().trim().max(50)).optional().default([]),
  maxFeeMinor: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().default('INR'),
  providerType: z.enum(['doctor', 'clinic', 'hospital', 'diagnostic_center']).optional().nullable(),
});

export type ValidatedAiSearchIntent = z.infer<typeof aiSearchIntentSchema>;

export const aiSearchRequestSchema = z.object({
  prompt: z.string().trim().min(2, 'Please enter a search description').max(500, 'Search query cannot exceed 500 characters'),
});

export type AiSearchRequest = z.infer<typeof aiSearchRequestSchema>;

