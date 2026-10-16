import { User, UserRole, SavedProviderRecord } from '@/lib/types/auth';
import { providerRepository } from '@/lib/repositories/provider-repository';

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
    // Seed standard demo accounts (passwords hashed during init or known test hash)
    // Salt: e1b2c3d4, derived dummy password hash for Traveler123!
    this.users = [
      {
        id: 'user-traveler-001',
        name: 'Demo Traveler Sarah',
        email: 'traveler@example.com',
        // scrypt hash for "Traveler123!"
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

    // Seed one saved provider for user-traveler-001
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

  // OBJECT-LEVEL AUTHORIZATION: Saved providers are always isolated by userId
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
    // Check if already saved by this user
    const existing = this.savedProviders.find(
      (r) => r.userId === userId && r.providerId === providerId
    );
    if (existing) {
      return { ...existing };
    }

    // Retrieve provider details to store a snapshot
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

  // OBJECT-LEVEL AUTHORIZATION: Only the owner (matching userId) can remove a saved provider
  async removeSavedProvider(userId: string, recordIdOrProviderId: string): Promise<boolean> {
    const initialCount = this.savedProviders.length;
    this.savedProviders = this.savedProviders.filter((record) => {
      // Keep record if it belongs to someone else
      if (record.userId !== userId) return true;
      // If it belongs to this user, filter it out if ID or providerId matches
      return record.id !== recordIdOrProviderId && record.providerId !== recordIdOrProviderId;
    });

    return this.savedProviders.length < initialCount;
  }
}

export const userRepository = new MemoryUserRepository();

