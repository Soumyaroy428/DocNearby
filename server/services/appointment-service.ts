import {
  Appointment,
  AppointmentStatus,
  NotificationLog,
} from '@/shared/types/appointment';
import {
  IAppointmentRepository,
  MemoryAppointmentRepository,
  MongoAppointmentRepository,
} from '@/server/repositories/appointment-repository';
import {
  IProviderRepository,
  providerRepository as defaultProviderRepo,
} from '@/server/repositories/provider-repository';
import {
  NotificationService,
  notificationService as defaultNotificationService,
} from '@/server/services/notification-service';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
} from '@/server/validation/appointment';

export class AppointmentService {
  private repo: IAppointmentRepository;
  private providerRepo: IProviderRepository;
  private notificationService: NotificationService;

  constructor(
    repo?: IAppointmentRepository,
    providerRepo?: IProviderRepository,
    notificationService?: NotificationService
  ) {
    this.repo =
      repo ||
      (process.env.MONGODB_URI
        ? new MongoAppointmentRepository()
        : new MemoryAppointmentRepository());
    this.providerRepo = providerRepo || defaultProviderRepo;
    this.notificationService = notificationService || defaultNotificationService;
  }

  /**
   * Creates a new consultation request.
   * INVARIANT: Every new booking enters the 'requested' state.
   * It is NEVER marked as 'confirmed' at creation time.
   */
  async createAppointmentRequest(
    userId: string,
    rawInput: unknown
  ): Promise<{ appointment: Appointment; notification: NotificationLog }> {
    const validated = createAppointmentSchema.parse(rawInput);

    const provider = await this.providerRepo.getProviderById(validated.providerId);
    if (!provider) {
      throw new Error(`Provider ${validated.providerId} not found.`);
    }

    const facility = provider.facilities.find((f) => f.id === validated.facilityId);
    if (!facility) {
      throw new Error(`Facility ${validated.facilityId} not found for this provider.`);
    }

    const matchedService = provider.services.find(
      (s) => (validated.serviceId && s.id === validated.serviceId) || s.serviceName === validated.serviceName
    );

    const appointment = await this.repo.createAppointment({
      userId,
      patientName: validated.patientName,
      patientEmail: validated.patientEmail,
      patientPhone: validated.patientPhone,
      providerId: provider.id,
      providerName: provider.displayName,
      facilityId: facility.id,
      facilityName: facility.name,
      facilityAddress: `${facility.address}, ${facility.locality}, ${facility.city}`,
      serviceId: matchedService?.id || validated.serviceId,
      serviceName: validated.serviceName,
      estimatedFeeMinor: matchedService?.amountMinor,
      currency: matchedService?.currency || 'INR',
      requestedDate: validated.requestedDate,
      requestedTimeSlot: validated.requestedTimeSlot,
      status: 'requested', // STRICT INVARIANT
      patientNotes: validated.patientNotes || undefined,
    });

    // Dispatch retry-safe notification
    const notification = await this.notificationService.notifyAppointmentEvent(
      appointment,
      'appointment_requested',
      'email'
    );
    await this.repo.createNotificationLog(notification);

    return { appointment, notification };
  }

  /**
   * Retrieves an appointment with object-level authorization checks.
   */
  async getAppointmentById(
    userId: string,
    userRole: string,
    appointmentId: string
  ): Promise<{ appointment: Appointment; notifications: NotificationLog[] }> {
    const appointment = await this.repo.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    // Object-Level Authorization:
    // Patients can only access their own appointments.
    // Administrators can access any appointment.
    // Providers can only access appointments where providerId matches.
    if (userRole !== 'admin' && appointment.userId !== userId && appointment.providerId !== userId) {
      throw new Error('Forbidden: You do not have permission to view this appointment.');
    }

    const notifications = await this.repo.getNotificationsByAppointmentId(appointmentId);
    return { appointment, notifications };
  }

  /**
   * Lists appointments for the authenticated patient.
   */
  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return this.repo.getAppointmentsByUserId(userId);
  }

  /**
   * Lists appointments for a provider.
   */
  async getProviderAppointments(
    providerId: string,
    userId: string,
    userRole: string
  ): Promise<Appointment[]> {
    if (userRole !== 'admin' && providerId !== userId) {
      throw new Error('Forbidden: Access restricted to provider practice staff or administrators.');
    }
    return this.repo.getAppointmentsByProviderId(providerId);
  }

  /**
   * Updates the status of an appointment according to the lifecycle state machine.
   */
  async updateStatus(
    userId: string,
    userRole: string,
    appointmentId: string,
    rawInput: unknown
  ): Promise<{ appointment: Appointment; notification?: NotificationLog }> {
    const validated = updateAppointmentStatusSchema.parse(rawInput);

    const appointment = await this.repo.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    // Check terminal states: once completed or cancelled, state cannot be changed
    const terminalStates: AppointmentStatus[] = [
      'completed',
      'no_show',
      'cancelled_by_patient',
      'cancelled_by_provider',
    ];
    if (terminalStates.includes(appointment.status)) {
      throw new Error(
        `Cannot change status of an appointment that is already ${appointment.status.replace(/_/g, ' ')}.`
      );
    }

    // Authorization & Transition Rules:
    // 1. Patient cancellation: allowed if user owns the appointment
    if (validated.status === 'cancelled_by_patient') {
      if (appointment.userId !== userId && userRole !== 'admin') {
        throw new Error('Forbidden: Only the patient or an administrator can cancel this appointment.');
      }
    }

    // 2. Provider actions (confirm, provider cancellation, completion, no-show):
    // Requires provider role or admin role
    if (
      ['confirmed', 'cancelled_by_provider', 'completed', 'no_show'].includes(validated.status) &&
      userRole !== 'admin' &&
      userRole !== 'provider'
    ) {
      throw new Error('Forbidden: Only healthcare providers or administrators can perform this action.');
    }

    const updates: Partial<Appointment> = {
      status: validated.status,
    };

    if (validated.status === 'confirmed') {
      updates.confirmedDate = validated.confirmedDate || appointment.requestedDate;
      updates.confirmedTimeSlot = validated.confirmedTimeSlot || appointment.requestedTimeSlot;
      if (validated.clinicInstructions) {
        updates.clinicInstructions = validated.clinicInstructions;
      }
    }

    if (validated.status === 'rescheduled') {
      if (!validated.rescheduledDate || !validated.rescheduledTimeSlot) {
        throw new Error('Rescheduled date and time slot are required when rescheduling an appointment.');
      }
      updates.rescheduledDate = validated.rescheduledDate;
      updates.rescheduledTimeSlot = validated.rescheduledTimeSlot;
    }

    if (validated.status === 'cancelled_by_patient' || validated.status === 'cancelled_by_provider') {
      updates.cancellationReason = validated.note || 'No reason provided';
    }

    const updated = await this.repo.updateAppointment(
      appointmentId,
      updates,
      userId,
      validated.note || `Status transitioned to ${validated.status}`
    );

    if (!updated) {
      throw new Error('Failed to update appointment.');
    }

    // Dispatch appropriate notification
    let notification: NotificationLog | undefined;
    if (validated.status === 'confirmed') {
      notification = await this.notificationService.notifyAppointmentEvent(
        updated,
        'appointment_confirmed',
        'email',
        validated.note
      );
      await this.repo.createNotificationLog(notification);
    } else if (
      validated.status === 'cancelled_by_patient' ||
      validated.status === 'cancelled_by_provider'
    ) {
      notification = await this.notificationService.notifyAppointmentEvent(
        updated,
        'appointment_cancelled',
        'email',
        validated.note
      );
      await this.repo.createNotificationLog(notification);
    } else if (validated.status === 'rescheduled') {
      notification = await this.notificationService.notifyAppointmentEvent(
        updated,
        'appointment_rescheduled',
        'email',
        validated.note
      );
      await this.repo.createNotificationLog(notification);
    }

    return { appointment: updated, notification };
  }

  /**
   * Reschedules an appointment to a new date and time.
   */
  async rescheduleAppointment(
    userId: string,
    userRole: string,
    appointmentId: string,
    rawInput: unknown
  ): Promise<{ appointment: Appointment; notification: NotificationLog }> {
    const validated = rescheduleAppointmentSchema.parse(rawInput);

    const { appointment } = await this.getAppointmentById(userId, userRole, appointmentId);

    const result = await this.updateStatus(userId, userRole, appointmentId, {
      status: 'rescheduled',
      rescheduledDate: validated.newDate,
      rescheduledTimeSlot: validated.newTimeSlot,
      note: validated.reason,
    });

    return {
      appointment: result.appointment,
      notification: result.notification!,
    };
  }
}

export const appointmentService = new AppointmentService();
