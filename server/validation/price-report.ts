import { z } from 'zod';

export const priceReportSubmissionSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  providerName: z.string().trim().optional(),
  serviceId: z.string().optional(),
  serviceName: z.string().trim().min(2, 'Service name is required').max(100),
  reportedAmountMinor: z.coerce.number().int().positive('Price must be greater than zero'),
  currency: z.string().trim().default('INR'),
  observedDate: z.string().min(1, 'Observed date is required'),
  evidenceOrReceiptNotes: z
    .string()
    .trim()
    .min(10, 'Please provide details or receipt notes (at least 10 characters)')
    .max(1000, 'Notes cannot exceed 1000 characters'),
  reporterEmail: z.string().trim().email('Please enter a valid email address').optional().or(z.literal('')),
});

export type PriceReportSubmissionInput = z.infer<typeof priceReportSubmissionSchema>;

export const adminResolvePriceReportSchema = z.object({
  decision: z.enum(['accepted', 'dismissed']),
  reviewNotes: z.string().trim().min(3, 'Review notes must be at least 3 characters').max(1000),
  updateProviderPrice: z.boolean().default(false),
});

export type AdminResolvePriceReportInput = z.infer<typeof adminResolvePriceReportSchema>;
