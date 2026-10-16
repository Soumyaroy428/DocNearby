import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  preferredLanguage: z.string().trim().max(50).optional().default('English'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  preferredLanguage: z.string().trim().max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const saveProviderSchema = z.object({
  providerId: z.string().trim().min(1, 'Provider ID is required'),
  notes: z.string().trim().max(200, 'Notes cannot exceed 200 characters').optional(),
});

export type SaveProviderInput = z.infer<typeof saveProviderSchema>;

