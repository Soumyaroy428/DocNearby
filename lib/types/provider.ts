export type ProviderType = 'doctor' | 'clinic' | 'hospital' | 'diagnostic_center';

export type VerificationStatus = 'verified' | 'verification_pending' | 'unverified' | 'suspended';

export type PriceType = 'confirmed' | 'starting_from' | 'estimate' | 'unavailable';

export interface Facility {
  id: string;
  name: string;
  address: string;
  locality: string;
  city: string;
  state?: string;
  country: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  publicPhone?: string;
  hours?: string;
  accessibilityAttributes?: string[];
}

export interface ServicePrice {
  id: string;
  serviceName: string;
  amountMinor: number; // Stored in integer minor units (e.g., paise for INR)
  currency: string;    // ISO currency e.g. 'INR'
  priceType: PriceType;
  sourceType: string;
  sourceReference?: string;
  lastConfirmedAt: string; // ISO date string
  notes?: string;
}

export interface VerificationRecord {
  evidenceType: string;
  checkedBy: string;
  checkedAt: string;
  expiresAt?: string;
  whatWasChecked: string;
}

export interface Provider {
  id: string;
  displayName: string;
  providerType: ProviderType;
  specialties: string[];
  languages: string[];
  qualifications?: string[];
  experienceYears?: number;
  registrationReference?: string;
  verificationStatus: VerificationStatus;
  verificationSummary: string;
  verificationDetail?: VerificationRecord;
  facilities: Facility[];
  services: ServicePrice[];
  publicContact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isDemonstration: boolean; // Explicit flag for demo records to avoid fabricating real medical providers
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  city?: string;
  locality?: string;
  specialty?: string;
  language?: string;
  maxFeeMinor?: number;
  providerType?: ProviderType;
  verificationStatus?: VerificationStatus;
  query?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta?: Record<string, unknown>;
}

