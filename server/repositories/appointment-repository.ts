import {
  Appointment,
  AppointmentStatus,
  NotificationLog,
} from '@/shared/types/appointment';
import { getMongoDb, isMongoConfigured } from '@/server/db/mongodb';

export interface IAppointmentRepository {
  createAppointment(
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<Appointment>;
  getAppointmentById(id: string): Promise<Appointment | null>;
  getAppointmentsByUserId(userId: string): Promise<Appointment[]>;
  getAppointmentsByProviderId(providerId: string): Promise<Appointment[]>;
  updateAppointment(
    id: string,
    updates: Partial<Appointment>,
    changedByUserId: string,
    note?: string
  ): Promise<Appointment | null>;
  createNotificationLog(log: NotificationLog): Promise<NotificationLog>;
  getNotificationsByAppointmentId(appointmentId: string): Promise<NotificationLog[]>;
}

export class MemoryAppointmentRepository implements IAppointmentRepository {
  private appointments: Appointment[] = [];
  private notifications: NotificationLog[] = [];

  constructor() {
    this.seedDemoAppointments();
  }

  private seedDemoAppointments() {
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]; // 2 days from now
    const nextWeekDate = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]; // 5 days from now

    this.appointments = [
      {
        id: 'apt-demo-001',
        userId: 'user-traveler-001',
        patientName: 'Sarah Jenkins',
        patientEmail: 'sarah.jenkins@example.com',
        patientPhone: '+91 98765 43210',
        providerId: 'demo-prov-001',
        providerName: 'Demo Dr. Ananya Mukherjee',
        facilityId: 'demo-fac-001',
        facilityName: 'Demo City Skin & Wellness Clinic',
        facilityAddress: '14/B Park Street, 2nd Floor, Park Street, Kolkata',
        serviceId: 'demo-srv-001',
        serviceName: 'General Dermatology Consultation',
        estimatedFeeMinor: 80000,
        currency: 'INR',
        requestedDate: futureDate,
        requestedTimeSlot: '11:00 AM',
        status: 'requested',
        patientNotes: 'Acute contact dermatitis flare-up after hotel laundry soap exposure.',
        statusHistory: [
          {
            status: 'requested',
            changedByUserId: 'user-traveler-001',
            changedAt: now,
            note: 'Initial traveler booking request submitted.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'apt-demo-002',
        userId: 'user-traveler-001',
        patientName: 'Sarah Jenkins',
        patientEmail: 'sarah.jenkins@example.com',
        patientPhone: '+91 98765 43210',
        providerId: 'demo-prov-002',
        providerName: 'Demo Dr. Rajesh Sharma',
        facilityId: 'demo-fac-002',
        facilityName: 'Demo Central Care Polyclinic',
        facilityAddress: '42 Sector 18, Block B, Salt Lake, Kolkata',
        serviceId: 'demo-srv-003',
        serviceName: 'General Health Consultation',
        estimatedFeeMinor: 60000,
        currency: 'INR',
        requestedDate: nextWeekDate,
        requestedTimeSlot: '02:30 PM',
        confirmedDate: nextWeekDate,
        confirmedTimeSlot: '02:30 PM',
        status: 'confirmed',
        clinicInstructions: 'Please bring your passport and travel insurance policy card.',
        patientNotes: 'Routine follow-up for altitude prescription check.',
        statusHistory: [
          {
            status: 'requested',
            changedByUserId: 'user-traveler-001',
            changedAt: now,
            note: 'Initial request.',
          },
          {
            status: 'confirmed',
            changedByUserId: 'provider-staff-002',
            changedAt: now,
            note: 'Receptionist confirmed slot availability.',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.notifications = [
      {
        id: 'notif-seed-001',
        appointmentId: 'apt-demo-001',
        recipientUserId: 'user-traveler-001',
        recipientEmail: 'sarah.jenkins@example.com',
        recipientPhone: '+91 98765 43210',
        channel: 'email',
        eventType: 'appointment_requested',
        status: 'delivered',
        idempotencyKey: 'notif-apt-demo-001-appointment_requested-v1',
        attemptCount: 1,
        subject: '[REQUEST SUBMITTED] Consultation Request with Demo Dr. Ananya Mukherjee',
        bodyText: 'Your appointment request has been submitted and is awaiting confirmation.',
        createdAt: now,
        deliveredAt: now,
      },
      {
        id: 'notif-seed-002',
        appointmentId: 'apt-demo-002',
        recipientUserId: 'user-traveler-001',
        recipientEmail: 'sarah.jenkins@example.com',
        recipientPhone: '+91 98765 43210',
        channel: 'email',
        eventType: 'appointment_confirmed',
        status: 'delivered',
        idempotencyKey: 'notif-apt-demo-002-appointment_confirmed-v1',
        attemptCount: 1,
        subject: '[CONFIRMED] Your Consultation with Demo Dr. Rajesh Sharma is Confirmed',
        bodyText: 'Your appointment has been officially confirmed.',
        createdAt: now,
        deliveredAt: now,
      },
    ];
  }

  async createAppointment(
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<Appointment> {
    const now = new Date().toISOString();
    const id = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newAppointment: Appointment = {
      ...data,
      id,
      status: 'requested', // Invariant: Always starts as 'requested', never 'confirmed'
      statusHistory: [
        {
          status: 'requested',
          changedByUserId: data.userId,
          changedAt: now,
          note: 'Appointment request submitted by patient.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.appointments.unshift(newAppointment);
    return { ...newAppointment };
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const apt = this.appointments.find((a) => a.id === id);
    return apt ? { ...apt } : null;
  }

  async getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
    return this.appointments
      .filter((a) => a.userId === userId)
      .map((a) => ({ ...a }));
  }

  async getAppointmentsByProviderId(providerId: string): Promise<Appointment[]> {
    return this.appointments
      .filter((a) => a.providerId === providerId)
      .map((a) => ({ ...a }));
  }

  async updateAppointment(
    id: string,
    updates: Partial<Appointment>,
    changedByUserId: string,
    note?: string
  ): Promise<Appointment | null> {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const existing = this.appointments[index];
    const now = new Date().toISOString();

    const newHistory = [...existing.statusHistory];
    if (updates.status && updates.status !== existing.status) {
      newHistory.push({
        status: updates.status,
        changedByUserId,
        changedAt: now,
        note,
      });
    }

    const updated: Appointment = {
      ...existing,
      ...updates,
      statusHistory: newHistory,
      updatedAt: now,
    };

    this.appointments[index] = updated;
    return { ...updated };
  }

  async createNotificationLog(log: NotificationLog): Promise<NotificationLog> {
    this.notifications.push({ ...log });
    return { ...log };
  }

  async getNotificationsByAppointmentId(appointmentId: string): Promise<NotificationLog[]> {
    return this.notifications
      .filter((n) => n.appointmentId === appointmentId)
      .map((n) => ({ ...n }));
  }
}

export class MongoAppointmentRepository implements IAppointmentRepository {
  private fallback: MemoryAppointmentRepository;

  constructor() {
    this.fallback = new MemoryAppointmentRepository();
  }

  private async getDb() {
    try {
      return await getMongoDb();
    } catch {
      return null;
    }
  }

  async createAppointment(
    data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<Appointment> {
    const db = await this.getDb();
    if (!db) return this.fallback.createAppointment(data);

    const now = new Date().toISOString();
    const id = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newAppointment: Appointment = {
      ...data,
      id,
      status: 'requested',
      statusHistory: [
        {
          status: 'requested',
          changedByUserId: data.userId,
          changedAt: now,
          note: 'Appointment request submitted by patient.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection('appointments').insertOne({ ...newAppointment });
      return { ...newAppointment };
    } catch {
      return this.fallback.createAppointment(data);
    }
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.getAppointmentById(id);

    try {
      const apt = await db.collection<Appointment>('appointments').findOne({ id });
      return apt ? { ...apt } : this.fallback.getAppointmentById(id);
    } catch {
      return this.fallback.getAppointmentById(id);
    }
  }

  async getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getAppointmentsByUserId(userId);

    try {
      const items = await db
        .collection<Appointment>('appointments')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      return items.map((a) => ({ ...a }));
    } catch {
      return this.fallback.getAppointmentsByUserId(userId);
    }
  }

  async getAppointmentsByProviderId(providerId: string): Promise<Appointment[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getAppointmentsByProviderId(providerId);

    try {
      const items = await db
        .collection<Appointment>('appointments')
        .find({ providerId })
        .sort({ createdAt: -1 })
        .toArray();
      return items.map((a) => ({ ...a }));
    } catch {
      return this.fallback.getAppointmentsByProviderId(providerId);
    }
  }

  async updateAppointment(
    id: string,
    updates: Partial<Appointment>,
    changedByUserId: string,
    note?: string
  ): Promise<Appointment | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.updateAppointment(id, updates, changedByUserId, note);

    try {
      const current = await this.getAppointmentById(id);
      if (!current) return null;

      const now = new Date().toISOString();
      const newHistory = [...current.statusHistory];
      if (updates.status && updates.status !== current.status) {
        newHistory.push({
          status: updates.status,
          changedByUserId,
          changedAt: now,
          note,
        });
      }

      const updatedFields = {
        ...updates,
        statusHistory: newHistory,
        updatedAt: now,
      };

      await db.collection('appointments').updateOne({ id }, { $set: updatedFields });
      return { ...current, ...updatedFields };
    } catch {
      return this.fallback.updateAppointment(id, updates, changedByUserId, note);
    }
  }

  async createNotificationLog(log: NotificationLog): Promise<NotificationLog> {
    const db = await this.getDb();
    if (!db) return this.fallback.createNotificationLog(log);

    try {
      await db.collection('notifications').insertOne({ ...log });
      return { ...log };
    } catch {
      return this.fallback.createNotificationLog(log);
    }
  }

  async getNotificationsByAppointmentId(appointmentId: string): Promise<NotificationLog[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getNotificationsByAppointmentId(appointmentId);

    try {
      const items = await db
        .collection<NotificationLog>('notifications')
        .find({ appointmentId })
        .sort({ createdAt: 1 })
        .toArray();
      return items.map((n) => ({ ...n }));
    } catch {
      return this.fallback.getNotificationsByAppointmentId(appointmentId);
    }
  }
}

export const appointmentRepository: IAppointmentRepository = isMongoConfigured()
  ? new MongoAppointmentRepository()
  : new MemoryAppointmentRepository();
