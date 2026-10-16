import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentService } from '@/server/services/appointment-service';
import { MemoryAppointmentRepository } from '@/server/repositories/appointment-repository';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';
import { NotificationService } from '@/server/services/notification-service';
import { getAppointmentStatusBadge } from '@/shared/utils/formatters';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
} from '@/server/validation/appointment';

describe('CC-06 — Appointments & Notifications Lifecycle', () => {
  let aptRepo: MemoryAppointmentRepository;
  let providerRepo: MemoryProviderRepository;
  let notificationService: NotificationService;
  let service: AppointmentService;

  beforeEach(() => {
    aptRepo = new MemoryAppointmentRepository();
    providerRepo = new MemoryProviderRepository();
    notificationService = new NotificationService();
    service = new AppointmentService(aptRepo, providerRepo, notificationService);
  });

  describe('Appointment Status Badge & Invariant Labels', () => {
    it('accurately distinguishes requested from confirmed status to prevent confusion', () => {
      const requested = getAppointmentStatusBadge('requested');
      expect(requested.isConfirmed).toBe(false);
      expect(requested.isPending).toBe(true);
      expect(requested.label).toBe('Request Submitted');
      expect(requested.description).toContain('awaiting confirmation');

      const confirmed = getAppointmentStatusBadge('confirmed');
      expect(confirmed.isConfirmed).toBe(true);
      expect(confirmed.isPending).toBe(false);
      expect(confirmed.label).toBe('Confirmed by Clinic');

      const rescheduled = getAppointmentStatusBadge('rescheduled');
      expect(rescheduled.isConfirmed).toBe(true);
      expect(rescheduled.label).toBe('Rescheduled');

      const cancelled = getAppointmentStatusBadge('cancelled_by_patient');
      expect(cancelled.isConfirmed).toBe(false);
      expect(cancelled.label).toBe('Cancelled by You');
    });
  });

  describe('Validation Schemas', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    it('validates a correct appointment booking request', () => {
      const input = {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Devon Vance',
        patientEmail: 'devon@example.com',
        patientPhone: '+91 98765 12345',
        requestedDate: tomorrow,
        requestedTimeSlot: '10:30 AM',
        patientNotes: 'Consultation for allergic reaction.',
      };

      const result = createAppointmentSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects booking dates in the past', () => {
      const pastInput = {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Devon Vance',
        patientEmail: 'devon@example.com',
        patientPhone: '+91 98765 12345',
        requestedDate: yesterday, // Past date
        requestedTimeSlot: '10:30 AM',
      };

      const result = createAppointmentSchema.safeParse(pastInput);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email formats', () => {
      const invalidEmail = {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'Consultation',
        patientName: 'Devon Vance',
        patientEmail: 'not-an-email',
        patientPhone: '+91 98765 12345',
        requestedDate: tomorrow,
        requestedTimeSlot: '10:30 AM',
      };

      const result = createAppointmentSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('Appointment Request Invariant & Creation', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('creates an appointment request strictly in "requested" state, NEVER "confirmed"', async () => {
      const input = {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Alex Mercer',
        patientEmail: 'alex.mercer@example.com',
        patientPhone: '+91 91234 56789',
        requestedDate: tomorrow,
        requestedTimeSlot: '11:30 AM',
        patientNotes: 'Acute sunburn flare-up.',
      };

      const { appointment, notification } = await service.createAppointmentRequest('user-traveler-042', input);

      expect(appointment).toBeDefined();
      expect(appointment.id).toMatch(/^apt-/);
      // STRICT INVARIANT TEST
      expect(appointment.status).toBe('requested');
      expect(appointment.confirmedDate).toBeUndefined();
      expect(appointment.confirmedTimeSlot).toBeUndefined();
      expect(appointment.statusHistory).toHaveLength(1);
      expect(appointment.statusHistory[0].status).toBe('requested');

      // Verify notification was dispatched
      expect(notification).toBeDefined();
      expect(notification.status).toBe('delivered');
      expect(notification.eventType).toBe('appointment_requested');
      expect(notification.subject).toContain('[REQUEST SUBMITTED]');
      expect(notification.bodyText).toContain('REQUESTED and NOT YET CONFIRMED');
    });

    it('fails when requesting an appointment for a non-existent provider', async () => {
      await expect(
        service.createAppointmentRequest('user-traveler-042', {
          providerId: 'non-existent-prov',
          facilityId: 'fac-001',
          serviceName: 'Consultation',
          patientName: 'Alex Mercer',
          patientEmail: 'alex@example.com',
          patientPhone: '+91 91234 56789',
          requestedDate: tomorrow,
          requestedTimeSlot: '11:30 AM',
        })
      ).rejects.toThrow('Provider non-existent-prov not found');
    });

    it('fails when specifying a facility not belonging to the provider', async () => {
      await expect(
        service.createAppointmentRequest('user-traveler-042', {
          providerId: 'demo-prov-001',
          facilityId: 'demo-fac-999-foreign',
          serviceName: 'General Dermatology Consultation',
          patientName: 'Alex Mercer',
          patientEmail: 'alex@example.com',
          patientPhone: '+91 91234 56789',
          requestedDate: tomorrow,
          requestedTimeSlot: '11:30 AM',
        })
      ).rejects.toThrow('Facility demo-fac-999-foreign not found for this provider');
    });
  });

  describe('Appointment State Machine Transitions', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('allows a clinic/provider to confirm an appointment and dispatches confirmation notification', async () => {
      const { appointment } = await service.createAppointmentRequest('user-traveler-100', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Clara Oswald',
        patientEmail: 'clara@example.com',
        patientPhone: '+91 98765 43210',
        requestedDate: tomorrow,
        requestedTimeSlot: '02:30 PM',
      });

      expect(appointment.status).toBe('requested');

      // Provider confirms slot
      const updateResult = await service.updateStatus(
        'provider-staff-001',
        'provider',
        appointment.id,
        {
          status: 'confirmed',
          confirmedDate: tomorrow,
          confirmedTimeSlot: '02:30 PM',
          clinicInstructions: 'Please bring your photo ID and previous prescription slips.',
          note: 'Confirmed by reception Dr. Ananya Mukherjee practice.',
        }
      );

      expect(updateResult.appointment.status).toBe('confirmed');
      expect(updateResult.appointment.confirmedDate).toBe(tomorrow);
      expect(updateResult.appointment.confirmedTimeSlot).toBe('02:30 PM');
      expect(updateResult.appointment.clinicInstructions).toContain('photo ID');
      expect(updateResult.appointment.statusHistory).toHaveLength(2);
      expect(updateResult.appointment.statusHistory[1].status).toBe('confirmed');

      // Confirmation notification
      expect(updateResult.notification).toBeDefined();
      expect(updateResult.notification?.eventType).toBe('appointment_confirmed');
      expect(updateResult.notification?.subject).toContain('[CONFIRMED]');
      expect(updateResult.notification?.bodyText).toContain('CONFIRMED');
    });

    it('allows patient to cancel their own appointment request', async () => {
      const { appointment } = await service.createAppointmentRequest('user-traveler-101', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Rory Williams',
        patientEmail: 'rory@example.com',
        patientPhone: '+91 98765 43210',
        requestedDate: tomorrow,
        requestedTimeSlot: '04:30 PM',
      });

      const cancelResult = await service.updateStatus(
        'user-traveler-101',
        'traveler',
        appointment.id,
        {
          status: 'cancelled_by_patient',
          note: 'Travel flight got delayed, cannot make it.',
        }
      );

      expect(cancelResult.appointment.status).toBe('cancelled_by_patient');
      expect(cancelResult.appointment.cancellationReason).toContain('Travel flight got delayed');
      expect(cancelResult.notification?.eventType).toBe('appointment_cancelled');
    });

    it('rejects status changes once an appointment is in a terminal state (cancelled)', async () => {
      const { appointment } = await service.createAppointmentRequest('user-traveler-102', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Amy Pond',
        patientEmail: 'amy@example.com',
        patientPhone: '+91 98765 43210',
        requestedDate: tomorrow,
        requestedTimeSlot: '05:00 PM',
      });

      // Cancel it
      await service.updateStatus('user-traveler-102', 'traveler', appointment.id, {
        status: 'cancelled_by_patient',
        note: 'Cancelled.',
      });

      // Attempting to confirm an already cancelled appointment should fail
      await expect(
        service.updateStatus('provider-staff-001', 'provider', appointment.id, {
          status: 'confirmed',
        })
      ).rejects.toThrow('Cannot change status of an appointment that is already cancelled by patient');
    });
  });

  describe('Object-Level Authorization', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('prevents Patient B from viewing or modifying Patient A appointment', async () => {
      const { appointment } = await service.createAppointmentRequest('user-patient-A', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Patient A',
        patientEmail: 'patientA@example.com',
        patientPhone: '+91 91111 22222',
        requestedDate: tomorrow,
        requestedTimeSlot: '10:00 AM',
      });

      // Patient B tries to view Patient A's appointment
      await expect(
        service.getAppointmentById('user-patient-B', 'traveler', appointment.id)
      ).rejects.toThrow('Forbidden: You do not have permission to view this appointment');

      // Patient B tries to cancel Patient A's appointment
      await expect(
        service.updateStatus('user-patient-B', 'traveler', appointment.id, {
          status: 'cancelled_by_patient',
          note: 'Malicious cancellation attempt',
        })
      ).rejects.toThrow('Forbidden: Only the patient or an administrator can cancel this appointment');
    });

    it('prevents regular travelers from confirming appointments (requires provider or admin role)', async () => {
      const { appointment } = await service.createAppointmentRequest('user-patient-A', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Patient A',
        patientEmail: 'patientA@example.com',
        patientPhone: '+91 91111 22222',
        requestedDate: tomorrow,
        requestedTimeSlot: '10:00 AM',
      });

      // A regular traveler cannot confirm their own or anyone's appointment
      await expect(
        service.updateStatus('user-patient-A', 'traveler', appointment.id, {
          status: 'confirmed',
        })
      ).rejects.toThrow('Forbidden: Only healthcare providers or administrators can perform this action');
    });

    it('allows an administrator to view and update any appointment', async () => {
      const { appointment } = await service.createAppointmentRequest('user-patient-A', {
        providerId: 'demo-prov-001',
        facilityId: 'demo-fac-001',
        serviceName: 'General Dermatology Consultation',
        patientName: 'Patient A',
        patientEmail: 'patientA@example.com',
        patientPhone: '+91 91111 22222',
        requestedDate: tomorrow,
        requestedTimeSlot: '10:00 AM',
      });

      const adminView = await service.getAppointmentById('user-admin-01', 'admin', appointment.id);
      expect(adminView.appointment.id).toBe(appointment.id);
    });
  });

  describe('Retry-Safe Notification Dispatch & Idempotency', () => {
    it('generates consistent idempotency keys and prevents duplicate notification delivery', async () => {
      const mockSender = {
        sendEmail: async () => ({ success: true }),
        sendSms: async () => ({ success: true }),
      };
      const customNotifService = new NotificationService(mockSender);

      const apt = {
        id: 'apt-test-idempotency',
        userId: 'user-1',
        patientName: 'Test Patient',
        patientEmail: 'test@example.com',
        patientPhone: '+91 99999 88888',
        providerId: 'prov-1',
        providerName: 'Test Doctor',
        facilityId: 'fac-1',
        facilityName: 'City Clinic',
        serviceName: 'Consultation',
        currency: 'INR',
        requestedDate: '2026-10-20',
        requestedTimeSlot: '10:00 AM',
        status: 'requested' as const,
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const firstDispatch = await customNotifService.notifyAppointmentEvent(
        apt,
        'appointment_requested',
        'email'
      );

      expect(firstDispatch.status).toBe('delivered');
      expect(firstDispatch.idempotencyKey).toBe('notif-apt-test-idempotency-appointment_requested-v1');

      // Second dispatch with same event returns the existing delivered notification without duplication
      const secondDispatch = await customNotifService.notifyAppointmentEvent(
        apt,
        'appointment_requested',
        'email'
      );

      expect(secondDispatch.id).toBe(firstDispatch.id);
      expect(customNotifService.getNotificationHistory()).toHaveLength(1);
    });
  });
});
