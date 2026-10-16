import { z } from 'zod';

export const aiSearchIntentSchema = z.object({
  location: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  languages: z.array(z.string()).default([]),
  maxFeeMinor: z.number().int().positive().nullable().optional(),
  currency: z.literal('INR').default('INR'),
  providerType: z
    .enum(['doctor', 'clinic', 'hospital', 'diagnostic_center'])
    .nullable()
    .optional(),
});

export type ValidatedAiSearchIntent = z.infer<typeof aiSearchIntentSchema>;

export const aiAssistRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Query is required')
    .max(500, 'Query cannot exceed 500 characters to prevent prompt injection and token overflow'),
  targetLanguage: z.enum(['en', 'hi', 'bn']).default('en'),
});

export type ValidatedAiAssistRequest = z.infer<typeof aiAssistRequestSchema>;

export const phrasebookQuerySchema = z.object({
  category: z
    .enum(['all', 'emergency', 'consultation', 'pricing', 'directions', 'pharmacy'])
    .default('all'),
  targetLanguage: z.enum(['en', 'hi', 'bn']).default('en'),
});

export type ValidatedPhrasebookQuery = z.infer<typeof phrasebookQuerySchema>;
