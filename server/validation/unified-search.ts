import { z } from 'zod';

export const unifiedSearchQuerySchema = z.object({
  latitude: z
    .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(-90).max(90).optional())
    .optional(),
  longitude: z
    .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : undefined), z.number().min(-180).max(180).optional())
    .optional(),
  radiusKm: z
    .preprocess(
      (val) => (val !== undefined && val !== '' ? Number(val) : 10),
      z.number().min(0.5, 'Radius must be at least 0.5 km').max(50, 'Radius cannot exceed 50 km').default(10)
    )
    .default(10),
  query: z
    .string()
    .trim()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  specialty: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  city: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  source: z.enum(['all', 'docnearby', 'google_places']).default('all'),
  sortBy: z.enum(['distance', 'relevance', 'rating']).optional(),
  limit: z
    .preprocess((val) => (val !== undefined && val !== '' ? Number(val) : 20), z.number().int().min(1).max(50).default(20))
    .default(20),
});

export type ValidatedUnifiedSearchParams = z.infer<typeof unifiedSearchQuerySchema>;

