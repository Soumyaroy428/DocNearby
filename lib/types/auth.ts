export type UserRole = 'traveler' | 'provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: string;
  createdAt: string;
}

export interface SavedProviderRecord {
  id: string;
  userId: string;
  providerId: string;
  providerSnapshot: {
    displayName: string;
    specialties: string[];
    locality: string;
    city: string;
    verificationStatus: string;
  };
  savedAt: string;
  notes?: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number; // Expiration timestamp in seconds
}

