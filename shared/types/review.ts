/**
 * DocNearby Reviews, Moderation & Trust Types
 * Manages patient experience feedback, moderation workflows, abuse controls,
 * and profile correction reports while strictly separating reviews from
 * statutory medical verification.
 */

export type ReviewStatus =
  | 'published'
  | 'pending_moderation'
  | 'flagged'
  | 'hidden'
  | 'rejected';

export type ReviewFlagReason =
  | 'spam'
  | 'offensive'
  | 'fake_review'
  | 'pii_leak'
  | 'conflict_of_interest'
  | 'other';

export type CorrectionType =
  | 'qualifications'
  | 'address_location'
  | 'contact_info'
  | 'operating_hours'
  | 'languages'
  | 'provider_inactive'
  | 'other';

export type CorrectionStatus =
  | 'pending'
  | 'reviewed'
  | 'resolved'
  | 'dismissed';

export interface ProviderResponse {
  responseText: string;
  respondedAt: string;
  respondedByUserId: string;
  responderName: string;
}

export interface Review {
  id: string;
  providerId: string;
  userId: string;
  authorName: string;
  rating: number; // 1 to 5 stars
  title: string;
  comment: string;
  waitTimeMinutes?: number;
  languageSatisfaction?: number; // 1 to 5
  cleanlinessRating?: number; // 1 to 5
  priceAccuracy?: boolean; // Was the consultation fee as listed on DocNearby?
  visitDate?: string; // Format: YYYY-MM
  isVerifiedPatient: boolean; // True if author completed an appointment via DocNearby
  status: ReviewStatus;
  moderationReason?: string;
  flagCount: number;
  providerResponse?: ProviderResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRatingSummary {
  providerId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  averageWaitTimeMinutes?: number;
  priceAccuracyRate?: number; // Percentage 0-100
  verifiedPatientReviewCount: number;
}

export interface ReviewFlagReport {
  id: string;
  reviewId: string;
  providerId: string;
  reporterUserId: string;
  reason: ReviewFlagReason;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
}

export interface ProviderCorrectionReport {
  id: string;
  providerId: string;
  providerName: string;
  reporterUserId?: string;
  reporterEmail?: string;
  reporterRole: 'patient' | 'provider' | 'public';
  correctionType: CorrectionType;
  description: string;
  suggestedValue?: string;
  status: CorrectionStatus;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
}

