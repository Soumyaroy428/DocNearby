import {
  NotificationLog,
  NotificationEventType,
  NotificationChannel,
  Appointment,
} from '@/shared/types/appointment';
import { formatDate } from '@/shared/utils/formatters';

export interface INotificationSender {
  sendEmail(to: string, subject: string, bodyText: string): Promise<{ success: boolean; error?: string }>;
  sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }>;
}

export class MockNotificationSender implements INotificationSender {
  async sendEmail(to: string, subject: string, bodyText: string) {
    // In automated tests or local dev, simulate successful transactional dispatch
    return { success: true };
  }

  async sendSms(to: string, message: string) {
    return { success: true };
  }
}

export class NotificationService {
  private sender: INotificationSender;
  private notificationHistory: Map<string, NotificationLog> = new Map();

  constructor(sender?: INotificationSender) {
    this.sender = sender || new MockNotificationSender();
  }

  /**
   * Generates a deterministic idempotency key for retry-safety.
   */
  generateIdempotencyKey(appointmentId: string, eventType: NotificationEventType, attempt = 1): string {
    return `notif-${appointmentId}-${eventType}-v${attempt}`;
  }

  /**
   * Dispatches an event notification with idempotency protection.
   */
  async notifyAppointmentEvent(
    appointment: Appointment,
    eventType: NotificationEventType,
    channel: NotificationChannel = 'email',
    customNote?: string
  ): Promise<NotificationLog> {
    const idempotencyKey = this.generateIdempotencyKey(appointment.id, eventType);

    // Check if an identical notification was already delivered
    const existing = this.notificationHistory.get(idempotencyKey);
    if (existing && existing.status === 'delivered') {
      return existing;
    }

    const { subject, bodyText } = this.composeNotificationContent(appointment, eventType, customNote);
    const now = new Date().toISOString();
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const log: NotificationLog = {
      id,
      appointmentId: appointment.id,
      recipientUserId: appointment.userId,
      recipientEmail: appointment.patientEmail,
      recipientPhone: appointment.patientPhone,
      channel,
      eventType,
      status: 'pending',
      idempotencyKey,
      attemptCount: 1,
      subject,
      bodyText,
      createdAt: now,
    };

    try {
      if (channel === 'email') {
        const res = await this.sender.sendEmail(appointment.patientEmail, subject, bodyText);
        if (res.success) {
          log.status = 'delivered';
          log.deliveredAt = new Date().toISOString();
        } else {
          log.status = 'failed';
          log.errorMessage = res.error || 'Email dispatch failed';
        }
      } else {
        const res = await this.sender.sendSms(appointment.patientPhone, bodyText);
        if (res.success) {
          log.status = 'delivered';
          log.deliveredAt = new Date().toISOString();
        } else {
          log.status = 'failed';
          log.errorMessage = res.error || 'SMS dispatch failed';
        }
      }
    } catch (err: unknown) {
      log.status = 'failed';
      log.errorMessage = err instanceof Error ? err.message : 'Unknown dispatch error';
    }

    this.notificationHistory.set(idempotencyKey, log);
    return log;
  }

  /**
   * Formats honest, unambiguous notification copy.
   * Explicitly avoids implying that a requested appointment is already confirmed.
   */
  composeNotificationContent(
    appointment: Appointment,
    eventType: NotificationEventType,
    customNote?: string
  ): { subject: string; bodyText: string } {
    const provider = appointment.providerName;
    const facility = appointment.facilityName;
    const dateFormatted = formatDate(appointment.requestedDate);
    const time = appointment.requestedTimeSlot;

    switch (eventType) {
      case 'appointment_requested':
        return {
          subject: `[REQUEST SUBMITTED] Consultation Request with ${provider} (Pending Confirmation)`,
          bodyText:
            `Hello ${appointment.patientName},\n\n` +
            `Your appointment request with ${provider} at ${facility} has been received.\n\n` +
            `Requested Date: ${dateFormatted}\n` +
            `Requested Slot: ${time}\n` +
            `Service: ${appointment.serviceName}\n\n` +
            `IMPORTANT: This appointment is REQUESTED and NOT YET CONFIRMED. Clinic staff will review room and doctor availability before confirming. You will receive an official confirmation notice once accepted.\n\n` +
            (customNote ? `Note: ${customNote}\n\n` : '') +
            `DocNearby Care Team`,
        };

      case 'appointment_confirmed':
        const confDate = appointment.confirmedDate ? formatDate(appointment.confirmedDate) : dateFormatted;
        const confTime = appointment.confirmedTimeSlot || time;
        return {
          subject: `[CONFIRMED] Your Consultation with ${provider} is Confirmed`,
          bodyText:
            `Hello ${appointment.patientName},\n\n` +
            `Good news! Your appointment with ${provider} at ${facility} has been CONFIRMED.\n\n` +
            `Confirmed Date: ${confDate}\n` +
            `Confirmed Slot: ${confTime}\n` +
            `Facility: ${facility} (${appointment.facilityAddress || ''})\n\n` +
            (appointment.clinicInstructions ? `Instructions from Clinic: ${appointment.clinicInstructions}\n\n` : '') +
            (customNote ? `Note: ${customNote}\n\n` : '') +
            `Please arrive 15 minutes before your scheduled slot. If your travel plans change, please cancel or reschedule via DocNearby.\n\n` +
            `DocNearby Care Team`,
        };

      case 'appointment_rescheduled':
        const reschDate = appointment.rescheduledDate ? formatDate(appointment.rescheduledDate) : dateFormatted;
        const reschTime = appointment.rescheduledTimeSlot || time;
        return {
          subject: `[RESCHEDULED] Updated Time Slot for ${provider}`,
          bodyText:
            `Hello ${appointment.patientName},\n\n` +
            `Your appointment with ${provider} has been rescheduled.\n\n` +
            `New Scheduled Date: ${reschDate}\n` +
            `New Time Slot: ${reschTime}\n` +
            `Facility: ${facility}\n\n` +
            (customNote ? `Reason: ${customNote}\n\n` : '') +
            `If this updated slot does not work with your itinerary, you may reschedule or cancel your visit via your DocNearby account.\n\n` +
            `DocNearby Care Team`,
        };

      case 'appointment_cancelled':
        return {
          subject: `[CANCELLED] Appointment with ${provider}`,
          bodyText:
            `Hello ${appointment.patientName},\n\n` +
            `Your appointment with ${provider} scheduled for ${dateFormatted} at ${time} has been cancelled.\n\n` +
            (appointment.cancellationReason ? `Reason: ${appointment.cancellationReason}\n\n` : '') +
            (customNote ? `Additional details: ${customNote}\n\n` : '') +
            `If you require medical assistance, you can search for other available doctors and urgent care clinics on DocNearby.\n\n` +
            `DocNearby Care Team`,
        };
    }
  }

  getNotificationHistory(): NotificationLog[] {
    return Array.from(this.notificationHistory.values());
  }

  clearHistory(): void {
    this.notificationHistory.clear();
  }
}

export const notificationService = new NotificationService();
