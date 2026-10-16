export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled_by_patient'
  | 'cancelled_by_provider'
  | 'completed'
  | 'no_show';

export interface AppointmentStatusHistoryEntry {
  status: AppointmentStatus;
  changedByUserId: string;
  changedAt: string;
  note?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  providerId: string;
  providerName: string;
  facilityId: string;
  facilityName: string;
  facilityAddress?: string;
  serviceId?: string;
  serviceName: string;
  estimatedFeeMinor?: number;
  currency: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTimeSlot: string; // e.g. "10:30 AM"
  status: AppointmentStatus;
  confirmedDate?: string;
  confirmedTimeSlot?: string;
  rescheduledDate?: string;
  rescheduledTimeSlot?: string;
  patientNotes?: string;
  cancellationReason?: string;
  clinicInstructions?: string;
  statusHistory: AppointmentStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'email' | 'sms';

export type NotificationEventType =
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'appointment_rescheduled'
  | 'appointment_cancelled';

export type NotificationDeliveryStatus = 'delivered' | 'pending' | 'failed';

export interface NotificationLog {
  id: string;
  appointmentId: string;
  recipientUserId?: string;
  recipientEmail: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  status: NotificationDeliveryStatus;
  idempotencyKey: string;
  attemptCount: number;
  subject: string;
  bodyText: string;
  createdAt: string;
  deliveredAt?: string;
  errorMessage?: string;
}
