import { User, UserRole, SavedProviderRecord } from '@/shared/types/auth';
import { providerRepository } from '@/server/repositories/provider-repository';
import { getMongoDb, isMongoConfigured } from '@/server/db/mongodb';

export interface IUserRepository {
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateProfile(id: string, updates: { name?: string; preferredLanguage?: string }): Promise<User | null>;
  getSavedProviders(userId: string): Promise<SavedProviderRecord[]>;
  saveProvider(userId: string, providerId: string, notes?: string): Promise<SavedProviderRecord | null>;
  removeSavedProvider(userId: string, recordId: string): Promise<boolean>;
  isProviderSaved(userId: string, providerId: string): Promise<boolean>;
}

export class MemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private savedProviders: SavedProviderRecord[] = [];

  constructor() {
    this.users = [
      {
        id: 'user-traveler-001',
        name: 'Demo Traveler Sarah',
        email: 'traveler@example.com',
        passwordHash: '8b7d9ef1a2c3b4d5:6d5ef0a97c8d91b2e3f4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
        role: 'traveler',
        preferredLanguage: 'English',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'user-provider-001',
        name: 'Demo Dr. Mukherjee Account',
        email: 'provider@example.com',
        passwordHash: '8b7d9ef1a2c3b4d5:6d5ef0a97c8d91b2e3f4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
        role: 'provider',
        preferredLanguage: 'Bengali',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'user-admin-001',
        name: 'DocNearby Trust Admin',
        email: 'admin@docnearby.example.com',
        passwordHash: '8b7d9ef1a2c3b4d5:6d5ef0a97c8d91b2e3f4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
        role: 'admin',
        preferredLanguage: 'English',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ];

    this.savedProviders = [
      {
        id: 'saved-rec-001',
        userId: 'user-traveler-001',
        providerId: 'demo-prov-001',
        providerSnapshot: {
          displayName: 'Demo Dr. Ananya Mukherjee',
          specialties: ['Dermatology', 'Cosmetology'],
          locality: 'Park Street',
          city: 'Kolkata',
          verificationStatus: 'verified',
        },
        savedAt: '2026-09-15T10:00:00Z',
        notes: 'Recommended for skin consultation',
      },
    ];
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(newUser);
    return { ...newUser };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async updateProfile(
    id: string,
    updates: { name?: string; preferredLanguage?: string }
  ): Promise<User | null> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return null;

    if (updates.name) this.users[userIndex].name = updates.name;
    if (updates.preferredLanguage) this.users[userIndex].preferredLanguage = updates.preferredLanguage;
    this.users[userIndex].updatedAt = new Date().toISOString();

    return { ...this.users[userIndex] };
  }

  async getSavedProviders(userId: string): Promise<SavedProviderRecord[]> {
    return this.savedProviders
      .filter((record) => record.userId === userId)
      .map((r) => ({ ...r }));
  }

  async isProviderSaved(userId: string, providerId: string): Promise<boolean> {
    return this.savedProviders.some(
      (r) => r.userId === userId && r.providerId === providerId
    );
  }

  async saveProvider(
    userId: string,
    providerId: string,
    notes?: string
  ): Promise<SavedProviderRecord | null> {
    const existing = this.savedProviders.find(
      (r) => r.userId === userId && r.providerId === providerId
    );
    if (existing) {
      return { ...existing };
    }

    const provider = await providerRepository.getProviderById(providerId);
    if (!provider) return null;

    const primaryFacility = provider.facilities[0];
    const newRecord: SavedProviderRecord = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      providerId,
      providerSnapshot: {
        displayName: provider.displayName,
        specialties: provider.specialties,
        locality: primaryFacility ? primaryFacility.locality : '',
        city: primaryFacility ? primaryFacility.city : '',
        verificationStatus: provider.verificationStatus,
      },
      savedAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    this.savedProviders.push(newRecord);
    return { ...newRecord };
  }

  async removeSavedProvider(userId: string, recordIdOrProviderId: string): Promise<boolean> {
    const initialCount = this.savedProviders.length;
    this.savedProviders = this.savedProviders.filter((record) => {
      if (record.userId !== userId) return true;
      return record.id !== recordIdOrProviderId && record.providerId !== recordIdOrProviderId;
    });

    return this.savedProviders.length < initialCount;
  }
}

/**
 * MongoDB Atlas persistent repository with fallback to memory if database is unreachable.
 */
export class MongoUserRepository implements IUserRepository {
  private fallback = new MemoryUserRepository();
  private hasInitialized = false;

  private async getDb() {
    if (!isMongoConfigured()) return null;
    try {
      const db = await getMongoDb();
      if (!this.hasInitialized) {
        this.hasInitialized = true;
        // Ensure index
        await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
        await db.collection('saved_providers').createIndex({ userId: 1 }).catch(() => {});
      }
      return db;
    } catch {
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.createUser(userData);
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection('users').insertOne({ ...newUser });
      return { ...newUser };
    } catch (err: unknown) {
      // Check duplicate key error (code 11000)
      if ((err as { code?: number })?.code === 11000) {
        throw new Error('An account with this email address already exists.');
      }
      return this.fallback.createUser(userData);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.findByEmail(email);
    }

    try {
      const normalized = email.trim().toLowerCase();
      const user = await db.collection('users').findOne<User>({
        email: { $regex: new RegExp(`^${normalized}$`, 'i') },
      });
      return user ? { ...user } : this.fallback.findByEmail(email);
    } catch {
      return this.fallback.findByEmail(email);
    }
  }

  async findById(id: string): Promise<User | null> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.findById(id);
    }

    try {
      const user = await db.collection('users').findOne<User>({ id });
      return user ? { ...user } : this.fallback.findById(id);
    } catch {
      return this.fallback.findById(id);
    }
  }

  async updateProfile(
    id: string,
    updates: { name?: string; preferredLanguage?: string }
  ): Promise<User | null> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.updateProfile(id, updates);
    }

    try {
      const now = new Date().toISOString();
      const setDoc: Record<string, unknown> = { updatedAt: now };
      if (updates.name) setDoc.name = updates.name;
      if (updates.preferredLanguage) setDoc.preferredLanguage = updates.preferredLanguage;

      await db.collection('users').updateOne({ id }, { $set: setDoc });
      return this.findById(id);
    } catch {
      return this.fallback.updateProfile(id, updates);
    }
  }

  async getSavedProviders(userId: string): Promise<SavedProviderRecord[]> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.getSavedProviders(userId);
    }

    try {
      const docs = await db
        .collection<SavedProviderRecord>('saved_providers')
        .find({ userId })
        .toArray();
      return docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        providerId: d.providerId,
        providerSnapshot: d.providerSnapshot,
        savedAt: d.savedAt,
        notes: d.notes,
      }));
    } catch {
      return this.fallback.getSavedProviders(userId);
    }
  }

  async isProviderSaved(userId: string, providerId: string): Promise<boolean> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.isProviderSaved(userId, providerId);
    }

    try {
      const count = await db
        .collection('saved_providers')
        .countDocuments({ userId, providerId });
      return count > 0;
    } catch {
      return this.fallback.isProviderSaved(userId, providerId);
    }
  }

  async saveProvider(
    userId: string,
    providerId: string,
    notes?: string
  ): Promise<SavedProviderRecord | null> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.saveProvider(userId, providerId, notes);
    }

    try {
      const existing = await db
        .collection<SavedProviderRecord>('saved_providers')
        .findOne({ userId, providerId });
      if (existing) {
        return { ...existing };
      }

      const provider = await providerRepository.getProviderById(providerId);
      if (!provider) return null;

      const primaryFacility = provider.facilities[0];
      const newRecord: SavedProviderRecord = {
        id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        providerId,
        providerSnapshot: {
          displayName: provider.displayName,
          specialties: provider.specialties,
          locality: primaryFacility ? primaryFacility.locality : '',
          city: primaryFacility ? primaryFacility.city : '',
          verificationStatus: provider.verificationStatus,
        },
        savedAt: new Date().toISOString(),
        notes: notes || undefined,
      };

      await db.collection('saved_providers').insertOne({ ...newRecord });
      return { ...newRecord };
    } catch {
      return this.fallback.saveProvider(userId, providerId, notes);
    }
  }

  async removeSavedProvider(userId: string, recordIdOrProviderId: string): Promise<boolean> {
    const db = await this.getDb();
    if (!db) {
      return this.fallback.removeSavedProvider(userId, recordIdOrProviderId);
    }

    try {
      const res = await db.collection('saved_providers').deleteOne({
        userId,
        $or: [{ id: recordIdOrProviderId }, { providerId: recordIdOrProviderId }],
      });
      return res.deletedCount > 0;
    } catch {
      return this.fallback.removeSavedProvider(userId, recordIdOrProviderId);
    }
  }
}

export const userRepository: IUserRepository = isMongoConfigured()
  ? new MongoUserRepository()
  : new MemoryUserRepository();
