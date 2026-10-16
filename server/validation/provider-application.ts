import { z } from 'zod';

export const providerSubmissionSchema = z.object({
  applicantName: z.string().min(2, 'Applicant name must be at least 2 characters').max(100),
  applicantEmail: z.string().email('Please enter a valid applicant email address'),
  applicantRole: z.string().min(2, 'Please state your role (e.g. Doctor, Clinic Administrator)').max(100),
  displayName: z.string().min(3, 'Provider name must be at least 3 characters').max(120),
  providerType: z.enum(['doctor', 'clinic', 'hospital', 'diagnostic_center'], {
    errorMap: () => ({ message: 'Please select a valid provider type' }),
  }),
  specialties: z.array(z.string().min(2)).min(1, 'Please specify at least one medical specialty'),
  languages: z.array(z.string().min(2)).min(1, 'Please specify at least one spoken language'),
  qualifications: z.array(z.string().min(2)).min(1, 'Please provide medical degrees or qualifications'),
  experienceYears: z.number().int().min(0, 'Experience years cannot be negative').max(70).optional(),
  registrationReference: z.string().min(3, 'Official registration/license number is required').max(100),
  authorityName: z.string().min(3, 'Registration authority name (e.g. State Medical Council) is required').max(150),
  documentStorageRef: z.string().max(200).optional(),
  locality: z.string().min(2, 'Locality is required').max(100),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(2).default('India'),
  consultationFeeMinor: z.number().int().min(0, 'Fee cannot be negative').max(10000000, 'Fee exceeds supported threshold'),
  publicPhone: z.string().min(6, 'Valid contact phone number is required').max(25),
  publicEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  publicWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type ProviderSubmissionInput = z.infer<typeof providerSubmissionSchema>;

export const adminReviewActionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'requires_correction', 'suspended'], {
    errorMap: () => ({ message: 'Please specify a valid review decision' }),
  }),
  evidenceType: z.string().min(3, 'Evidence type is required (e.g. state_medical_council_registration)'),
  whatWasChecked: z.string().min(5, 'Please describe what was checked in the official register'),
  reviewNotes: z.string().min(3, 'Reviewer notes or reason required'),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
});

export type AdminReviewActionInput = z.infer<typeof adminReviewActionSchema>;

export const adminSuspendActionSchema = z.object({
  reason: z.string().min(5, 'A clear reason for suspension must be recorded'),
});

export type AdminSuspendActionInput = z.infer<typeof adminSuspendActionSchema>;
