import {
  Review,
  ReviewStatus,
  ProviderRatingSummary,
  ReviewFlagReport,
  ReviewFlagReason,
  ProviderCorrectionReport,
  CorrectionType,
  CorrectionStatus,
} from '@/shared/types/review';
import {
  IReviewRepository,
  reviewRepository as defaultReviewRepo,
} from '@/server/repositories/review-repository';
import {
  IProviderRepository,
  providerRepository as defaultProviderRepo,
} from '@/server/repositories/provider-repository';
import {
  IAppointmentRepository,
  appointmentRepository as defaultAppointmentRepo,
} from '@/server/repositories/appointment-repository';
import { ValidatedCreateReview } from '@/server/validation/review';
import { PrivacyScrubber } from '@/server/ai/privacy-scrubber';

// Common offensive/abusive terms for pre-moderation screening
const RESTRICTED_TERMS = [
  /\b(scam(?:mer)?|fraud(?:ulent)?|cheat(?:er)?|criminal|murderer|quack)\b/i,
  /\b(fuck|shit|bitch|bastard|asshole|idiot|stupid)\b/i,
];

export class ReviewService {
  private reviewRepo: IReviewRepository;
  private providerRepo: IProviderRepository;
  private appointmentRepo: IAppointmentRepository;
  private userReviewTimestamps: Map<string, number[]> = new Map(); // Rate limiting: userId -> timestamps

  constructor(
    reviewRepo: IReviewRepository = defaultReviewRepo,
    providerRepo: IProviderRepository = defaultProviderRepo,
    appointmentRepo: IAppointmentRepository = defaultAppointmentRepo
  ) {
    this.reviewRepo = reviewRepo;
    this.providerRepo = providerRepo;
    this.appointmentRepo = appointmentRepo;
  }

  /**
   * Submit a new patient review with strict abuse controls
   */
  async submitReview(params: {
    providerId: string;
    userId: string;
    authorName: string;
    reviewData: ValidatedCreateReview;
  }): Promise<Review> {
    const { providerId, userId, authorName, reviewData } = params;

    // 1. Verify provider exists
    const provider = await this.providerRepo.getProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // 2. Prevent self-review (Provider cannot review their own practice)
    if (provider.userId && provider.userId === userId) {
      throw new Error('Healthcare providers cannot submit reviews for their own profile.');
    }

    // 3. Rate limiting: Max 3 reviews per hour per user
    const now = Date.now();
    const timestamps = this.userReviewTimestamps.get(userId) || [];
    const recentTimestamps = timestamps.filter((t) => now - t < 3600000);
    if (recentTimestamps.length >= 3) {
      throw new Error('Review submission rate limit reached. Maximum 3 reviews per hour.');
    }
    recentTimestamps.push(now);
    this.userReviewTimestamps.set(userId, recentTimestamps);

    // 4. Duplicate prevention: Max 1 active review per provider per 30 days
    const existingRecent = await this.reviewRepo.findRecentUserReviewForProvider(
      userId,
      providerId,
      30
    );
    if (existingRecent) {
      throw new Error(
        'You have already submitted a review for this provider within the last 30 days.'
      );
    }

    // 5. Verified patient check via CC-06 appointments
    let isVerifiedPatient = false;
    try {
      const userAppointments = await this.appointmentRepo.getAppointmentsByUserId(userId);
      isVerifiedPatient = userAppointments.some(
        (apt) =>
          apt.providerId === providerId &&
          ['confirmed', 'completed'].includes(apt.status)
      );
    } catch {
      isVerifiedPatient = false;
    }

    // 6. Pre-moderation & PII scanning
    const fullText = `${reviewData.title} ${reviewData.comment}`;
    const piiCheck = PrivacyScrubber.scrub(fullText);

    let status: ReviewStatus = 'published';
    let moderationReason: string | undefined = undefined;

    if (piiCheck.hadPii) {
      status = 'pending_moderation';
      moderationReason = 'Review contains potential personal contact information (PII) and has been queued for moderation.';
    } else {
      for (const term of RESTRICTED_TERMS) {
        if (term.test(fullText)) {
          status = 'pending_moderation';
          moderationReason = 'Review flagged by automated language filter for administrative moderation.';
          break;
        }
      }
    }

    // 7. Save review (Note: Never modifies provider.verificationStatus)
    return await this.reviewRepo.createReview({
      providerId,
      userId,
      authorName,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      waitTimeMinutes: reviewData.waitTimeMinutes,
      languageSatisfaction: reviewData.languageSatisfaction,
      cleanlinessRating: reviewData.cleanlinessRating,
      priceAccuracy: reviewData.priceAccuracy,
      visitDate: reviewData.visitDate,
      isVerifiedPatient,
      status,
      moderationReason,
    });
  }

  /**
   * Get published reviews and aggregate rating summary for a provider
   */
  async getProviderReviews(providerId: string): Promise<{
    reviews: Review[];
    ratingSummary: ProviderRatingSummary;
  }> {
    const reviews = await this.reviewRepo.getReviewsByProviderId(providerId, {
      includeUnpublished: false,
    });
    const ratingSummary = await this.reviewRepo.getProviderRatingSummary(providerId);

    return {
      reviews,
      ratingSummary,
    };
  }

  /**
   * Add an authorized provider response to a review
   */
  async respondToReview(params: {
    reviewId: string;
    providerUserId: string;
    responderName: string;
    responseText: string;
    isAdmin?: boolean;
  }): Promise<Review> {
    const { reviewId, providerUserId, responderName, responseText, isAdmin } = params;

    const review = await this.reviewRepo.getReviewById(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const provider = await this.providerRepo.getProviderById(review.providerId);
    if (!provider) {
      throw new Error(`Provider for review ${reviewId} not found`);
    }

    // Enforce ownership: only the provider or an administrator can respond
    if (!isAdmin && provider.userId !== providerUserId) {
      throw new Error('Unauthorized: You can only respond to reviews on your own provider profile.');
    }

    const updated = await this.reviewRepo.updateReview(reviewId, {
      providerResponse: {
        responseText,
        respondedAt: new Date().toISOString(),
        respondedByUserId: providerUserId,
        responderName,
      },
    });

    if (!updated) {
      throw new Error('Failed to save provider response');
    }

    return updated;
  }

  /**
   * Flag a review for community or legal moderation
   */
  async flagReview(params: {
    reviewId: string;
    reporterUserId: string;
    reason: ReviewFlagReason;
    details: string;
  }): Promise<ReviewFlagReport> {
    const { reviewId, reporterUserId, reason, details } = params;

    const review = await this.reviewRepo.getReviewById(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    return await this.reviewRepo.createReviewFlag({
      reviewId,
      providerId: review.providerId,
      reporterUserId,
      reason,
      details,
      status: 'pending',
    });
  }

  /**
   * Admin moderate review status
   */
  async moderateReview(params: {
    reviewId: string;
    status: ReviewStatus;
    moderationReason?: string;
  }): Promise<Review> {
    const { reviewId, status, moderationReason } = params;

    const review = await this.reviewRepo.getReviewById(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const updated = await this.reviewRepo.updateReview(reviewId, {
      status,
      moderationReason: moderationReason || review.moderationReason,
    });

    if (!updated) {
      throw new Error('Failed to update review moderation status');
    }

    return updated;
  }

  /**
   * Submit a provider profile correction report
   */
  async submitCorrectionReport(params: {
    providerId: string;
    reporterUserId?: string;
    reporterEmail?: string;
    reporterRole?: 'patient' | 'provider' | 'public';
    correctionType: CorrectionType;
    description: string;
    suggestedValue?: string;
  }): Promise<ProviderCorrectionReport> {
    const {
      providerId,
      reporterUserId,
      reporterEmail,
      reporterRole = 'patient',
      correctionType,
      description,
      suggestedValue,
    } = params;

    const provider = await this.providerRepo.getProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await this.reviewRepo.createCorrectionReport({
      providerId,
      providerName: provider.displayName,
      reporterUserId,
      reporterEmail,
      reporterRole,
      correctionType,
      description,
      suggestedValue,
      status: 'pending',
    });
  }

  /**
   * Admin resolve provider profile correction
   */
  async resolveCorrectionReport(params: {
    reportId: string;
    status: CorrectionStatus;
    adminNotes?: string;
    resolvedByUserId: string;
  }): Promise<ProviderCorrectionReport> {
    const { reportId, status, adminNotes, resolvedByUserId } = params;

    const report = await this.reviewRepo.getCorrectionReportById(reportId);
    if (!report) {
      throw new Error(`Correction report ${reportId} not found`);
    }

    const updated = await this.reviewRepo.updateCorrectionReport(reportId, {
      status,
      adminNotes,
      resolvedAt: new Date().toISOString(),
      resolvedByUserId,
    });

    if (!updated) {
      throw new Error('Failed to resolve correction report');
    }

    return updated;
  }

  /**
   * Get all reviews for admin dashboard
   */
  async getAllReviewsForAdmin(status?: ReviewStatus): Promise<Review[]> {
    return await this.reviewRepo.getAllReviews(status);
  }

  /**
   * Get all review flags for admin dashboard
   */
  async getReviewFlagsForAdmin(
    status?: 'pending' | 'resolved' | 'dismissed'
  ): Promise<ReviewFlagReport[]> {
    return await this.reviewRepo.getReviewFlags(status);
  }

  /**
   * Get all correction reports for admin dashboard
   */
  async getCorrectionReportsForAdmin(
    status?: CorrectionStatus
  ): Promise<ProviderCorrectionReport[]> {
    return await this.reviewRepo.getCorrectionReports(status);
  }
}

export const reviewService = new ReviewService();

