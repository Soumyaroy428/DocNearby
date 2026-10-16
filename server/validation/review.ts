import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  comment: z
    .string()
    .trim()
    .min(10, 'Review experience must be at least 10 characters')
    .max(1000, 'Review experience cannot exceed 1000 characters'),
  waitTimeMinutes: z
    .number()
    .int()
    .min(0, 'Wait time cannot be negative')
    .max(300, 'Wait time cannot exceed 300 minutes')
    .optional(),
  languageSatisfaction: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  cleanlinessRating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  priceAccuracy: z.boolean().optional(),
  visitDate: z
    .string()
    .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Visit date must be in YYYY-MM format')
    .optional(),
});

export type ValidatedCreateReview = z.infer<typeof createReviewSchema>;

export const flagReviewSchema = z.object({
  reason: z.enum([
    'spam',
    'offensive',
    'fake_review',
    'pii_leak',
    'conflict_of_interest',
    'other',
  ]),
  details: z
    .string()
    .trim()
    .min(5, 'Please provide at least 5 characters explaining the concern')
    .max(500, 'Details cannot exceed 500 characters'),
});

export type ValidatedFlagReview = z.infer<typeof flagReviewSchema>;

export const providerResponseSchema = z.object({
  responseText: z
    .string()
    .trim()
    .min(5, 'Response must be at least 5 characters')
    .max(1000, 'Response cannot exceed 1000 characters'),
});

export type ValidatedProviderResponse = z.infer<typeof providerResponseSchema>;

export const providerCorrectionSchema = z.object({
  providerId: z.string().trim().min(1, 'Provider ID is required'),
  correctionType: z.enum([
    'qualifications',
    'address_location',
    'contact_info',
    'operating_hours',
    'languages',
    'provider_inactive',
    'other',
  ]),
  description: z
    .string()
    .trim()
    .min(10, 'Correction description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  suggestedValue: z.string().trim().max(500).optional(),
  reporterEmail: z.string().email('Invalid email address').optional(),
});

export type ValidatedProviderCorrection = z.infer<typeof providerCorrectionSchema>;

export const moderateReviewSchema = z.object({
  status: z.enum(['published', 'pending_moderation', 'flagged', 'hidden', 'rejected']),
  moderationReason: z.string().trim().max(500).optional(),
});

export type ValidatedModerateReview = z.infer<typeof moderateReviewSchema>;

export const resolveCorrectionSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'dismissed']),
  adminNotes: z.string().trim().max(500).optional(),
});

export type ValidatedResolveCorrection = z.infer<typeof resolveCorrectionSchema>;

