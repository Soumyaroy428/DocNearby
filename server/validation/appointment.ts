import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  serviceId: z.string().optional(),
  serviceName: z.string().trim().min(2, 'Service name is required').max(100),
  patientName: z.string().trim().min(2, 'Patient name is required').max(100),
  patientEmail: z.string().trim().email('Please enter a valid email address'),
  patientPhone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number cannot exceed 20 digits'),
  requestedDate: z
    .string()
    .regex(dateRegex, 'Date must be formatted as YYYY-MM-DD')
    .refine((val) => {
      const today = new Date().toISOString().split('T')[0];
      return val >= today;
    }, 'Appointment date cannot be in the past'),
  requestedTimeSlot: z.string().trim().min(2, 'Time slot is required').max(30),
  patientNotes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    'confirmed',
    'rescheduled',
    'cancelled_by_patient',
    'cancelled_by_provider',
    'completed',
    'no_show',
  ]),
  note: z.string().trim().max(500).optional(),
  confirmedDate: z.string().regex(dateRegex).optional(),
  confirmedTimeSlot: z.string().trim().max(30).optional(),
  rescheduledDate: z.string().regex(dateRegex).optional(),
  rescheduledTimeSlot: z.string().trim().max(30).optional(),
  clinicInstructions: z.string().trim().max(500).optional(),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const rescheduleAppointmentSchema = z.object({
  newDate: z
    .string()
    .regex(dateRegex, 'Date must be formatted as YYYY-MM-DD')
    .refine((val) => {
      const today = new Date().toISOString().split('T')[0];
      return val >= today;
    }, 'Rescheduled date cannot be in the past'),
  newTimeSlot: z.string().trim().min(2, 'Time slot is required').max(30),
  reason: z.string().trim().min(3, 'Please provide a reason (at least 3 characters)').max(300),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
