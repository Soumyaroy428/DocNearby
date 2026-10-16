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

/**
 * Confidential verification details stored strictly server-side.
 * MUST NEVER be returned in public search or public provider profile APIs.
 */
export interface PrivateVerificationRecord {
  internalNotes?: string;
  documentStorageRef?: string;
  authorityName?: string;
  licenseRegistrationNumber: string;
  reviewedByUserId: string;
  reviewedAt: string;
  recheckScheduledAt?: string;
}

export interface Provider {
  id: string;
  userId?: string; // Linked provider user account
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
  isDemonstration: boolean; // Explicit flag for demo records
  createdAt: string;
  updatedAt: string;
  /** Calculated distance in kilometers when user coordinates are provided in search */
  distanceKm?: number;
  /** Private internal verification record (sanitized out in public endpoints) */
  privateVerificationRecord?: PrivateVerificationRecord;
}

export type SubmissionStatus = 'pending_review' | 'approved' | 'rejected' | 'requires_correction';

export interface ProviderSubmission {
  id: string;
  submittedByUserId: string;
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;
  displayName: string;
  providerType: ProviderType;
  specialties: string[];
  languages: string[];
  qualifications: string[];
  experienceYears?: number;
  registrationReference: string;
  authorityName: string;
  documentStorageRef?: string;
  locality: string;
  city: string;
  state?: string;
  country: string;
  consultationFeeMinor: number;
  publicPhone: string;
  publicEmail?: string;
  publicWebsite?: string;
  status: SubmissionStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdProviderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationDecision = 'approved' | 'rejected' | 'requires_correction' | 'suspended';

export interface AdminVerificationAction {
  decision: VerificationDecision;
  evidenceType: string;
  whatWasChecked: string;
  reviewNotes: string;
  expiresAt?: string;
}

export type SearchSortBy = 'relevance' | 'distance' | 'fee_asc' | 'fee_desc';

export interface SearchFilters {
  city?: string;
  locality?: string;
  specialty?: string;
  language?: string;
  maxFeeMinor?: number;
  providerType?: ProviderType;
  verificationStatus?: VerificationStatus;
  query?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: SearchSortBy;
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

// --- CC-05: Transparent Pricing & Correction Workflow Types ---

export type PriceCorrectionStatus = 'pending_review' | 'accepted' | 'dismissed';

export interface PriceCorrectionReport {
  id: string;
  providerId: string;
  providerName?: string;
  serviceId?: string;
  serviceName?: string;
  listedAmountMinor?: number;
  reportedAmountMinor: number;
  currency: string;
  observedDate: string; // ISO date string (YYYY-MM-DD)
  evidenceOrReceiptNotes: string;
  submittedByUserId?: string;
  reporterEmail?: string;
  status: PriceCorrectionStatus;
  reviewNotes?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceStalenessInfo {
  isStale: boolean;
  daysAgo: number;
  label: string;
  warningMessage?: string;
}

