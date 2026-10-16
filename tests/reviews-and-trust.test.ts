import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryReviewRepository } from '@/server/repositories/review-repository';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';
import { MemoryAppointmentRepository } from '@/server/repositories/appointment-repository';
import { ReviewService } from '@/server/services/review-service';

describe('CC-08 — Reviews and Trust', () => {
  let reviewRepo: MemoryReviewRepository;
  let providerRepo: MemoryProviderRepository;
  let appointmentRepo: MemoryAppointmentRepository;
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewRepo = new MemoryReviewRepository();
    providerRepo = new MemoryProviderRepository();
    appointmentRepo = new MemoryAppointmentRepository();
    reviewService = new ReviewService(reviewRepo, providerRepo, appointmentRepo);
  });

  describe('1. Review Submission & Aggregate Rating Summary', () => {
    it('submits a valid review and updates provider rating summary', async () => {
      const review = await reviewService.submitReview({
        providerId: 'demo-prov-001',
        userId: 'user-traveler-new',
        authorName: 'David Miller',
        reviewData: {
          rating: 5,
          title: 'Dr. Mukherjee was fantastic and attentive',
          comment:
            'Wonderful clinic experience during my trip. Great communication in English and transparent consultation fees.',
          waitTimeMinutes: 20,
          languageSatisfaction: 5,
          cleanlinessRating: 5,
          priceAccuracy: true,
          visitDate: '2026-10',
        },
      });

      expect(review.id).toBeDefined();
      expect(review.status).toBe('published');
      expect(review.rating).toBe(5);

      const { reviews, ratingSummary } = await reviewService.getProviderReviews('demo-prov-001');
      expect(reviews.some((r) => r.id === review.id)).toBe(true);
      expect(ratingSummary.totalReviews).toBeGreaterThanOrEqual(3);
      expect(ratingSummary.averageRating).toBeGreaterThanOrEqual(4.0);
      expect(ratingSummary.ratingDistribution[5]).toBeGreaterThanOrEqual(2);
    });

    it('handles reviews for providers with no prior ratings', async () => {
      const summary = await reviewRepo.getProviderRatingSummary('non-existent-prov');
      expect(summary.totalReviews).toBe(0);
      expect(summary.averageRating).toBe(0);
      expect(summary.verifiedPatientReviewCount).toBe(0);
    });
  });

  describe('2. Abuse Controls — Duplicate Reviews & Self-Reviews', () => {
    it('blocks duplicate reviews from the same user within 30 days', async () => {
      // First review
      await reviewService.submitReview({
        providerId: 'demo-prov-002',
        userId: 'user-spammer-123',
        authorName: 'Spam User',
        reviewData: {
          rating: 5,
          title: 'Great first experience here',
          comment: 'Doctor was prompt, polite, and very helpful with my consultation.',
        },
      });

      // Second review within 30 days must be rejected
      await expect(
        reviewService.submitReview({
          providerId: 'demo-prov-002',
          userId: 'user-spammer-123',
          authorName: 'Spam User',
          reviewData: {
            rating: 5,
            title: 'Another great visit today',
            comment: 'Submitting a second review on the same provider.',
          },
        })
      ).rejects.toThrow(/already submitted a review for this provider within the last 30 days/);
    });

    it('prohibits healthcare providers from reviewing their own practice', async () => {
      // Find a provider with a linked userId
      const provider = await providerRepo.getProviderById('demo-prov-001');
      expect(provider?.userId).toBeDefined();

      await expect(
        reviewService.submitReview({
          providerId: 'demo-prov-001',
          userId: provider!.userId!, // Own user ID
          authorName: 'Self Doctor',
          reviewData: {
            rating: 5,
            title: 'I am the best doctor in town',
            comment: 'Self promotional review trying to boost my rating.',
          },
        })
      ).rejects.toThrow(/providers cannot submit reviews for their own profile/);
    });

    it('enforces rate limits on review submissions (max 3/hour)', async () => {
      const rateLimitedUser = 'user-hyper-reviewer';

      // 1st review
      await reviewService.submitReview({
        providerId: 'demo-prov-001',
        userId: rateLimitedUser,
        authorName: 'Reviewer',
        reviewData: { rating: 4, title: 'Visit 1', comment: 'Reviewing doctor one' },
      });

      // 2nd review
      await reviewService.submitReview({
        providerId: 'demo-prov-002',
        userId: rateLimitedUser,
        authorName: 'Reviewer',
        reviewData: { rating: 4, title: 'Visit 2', comment: 'Reviewing doctor two' },
      });

      // 3rd review
      await reviewService.submitReview({
        providerId: 'demo-prov-003',
        userId: rateLimitedUser,
        authorName: 'Reviewer',
        reviewData: { rating: 4, title: 'Visit 3', comment: 'Reviewing doctor three' },
      });

      // 4th review exceeds hourly cap
      await expect(
        reviewService.submitReview({
          providerId: 'demo-prov-004',
          userId: rateLimitedUser,
          authorName: 'Reviewer',
          reviewData: { rating: 4, title: 'Visit 4', comment: 'Reviewing doctor four' },
        })
      ).rejects.toThrow(/Review submission rate limit reached/);
    });
  });

  describe('3. Verified Patient Badge', () => {
    it('stamps review as verified patient when user completed an appointment with provider', async () => {
      // user-traveler-001 has a confirmed appointment for demo-prov-002 in seed data
      const appointments = await appointmentRepo.getAppointmentsByUserId('user-traveler-001');
      const apt = appointments.find((a) => a.providerId === 'demo-prov-002' && a.status === 'confirmed');
      expect(apt).toBeDefined();

      const review = await reviewService.submitReview({
        providerId: 'demo-prov-002',
        userId: 'user-traveler-001',
        authorName: 'Sarah Jenkins',
        reviewData: {
          rating: 5,
          title: 'Verified post-consultation visit',
          comment: 'Doctor explained the skin allergy thoroughly and prescribed effective cream.',
        },
      });

      expect(review.isVerifiedPatient).toBe(true);
    });

    it('marks review as unverified patient when user had no confirmed appointment', async () => {
      const review = await reviewService.submitReview({
        providerId: 'demo-prov-003',
        userId: 'random-walk-in-patient',
        authorName: 'Walk-in Traveler',
        reviewData: {
          rating: 4,
          title: 'Walked in without an app booking',
          comment: 'Clinic staff attended to me quickly without prior reservation.',
        },
      });

      expect(review.isVerifiedPatient).toBe(false);
    });
  });

  describe('4. Content Moderation & PII Shielding', () => {
    it('queues review for moderation when PII (phone number or email) is included', async () => {
      const review = await reviewService.submitReview({
        providerId: 'demo-prov-002',
        userId: 'user-leaky-pii',
        authorName: 'Privacy Unaware Patient',
        reviewData: {
          rating: 5,
          title: 'Great doctor, call me at +91 98765 43210',
          comment: 'You can email me at patient@example.com for further questions about this doctor.',
        },
      });

      expect(review.status).toBe('pending_moderation');
      expect(review.moderationReason).toMatch(/potential personal contact information \(PII\)/);
    });

    it('queues review for moderation when abusive or prohibited terms are detected', async () => {
      const review = await reviewService.submitReview({
        providerId: 'demo-prov-002',
        userId: 'user-angry-patient',
        authorName: 'Angry Patient',
        reviewData: {
          rating: 1,
          title: 'Total scammer clinic',
          comment: 'This clinic is a complete fraud and quack scammer operation.',
        },
      });

      expect(review.status).toBe('pending_moderation');
      expect(review.moderationReason).toMatch(/automated language filter/);
    });
  });

  describe('5. Healthcare Trust Invariant — Separation from Credential Verification', () => {
    it('ensures that patient reviews never modify statutory medical verificationStatus', async () => {
      const providerBefore = await providerRepo.getProviderById('demo-prov-001');
      const initialVerificationStatus = providerBefore!.verificationStatus;
      expect(initialVerificationStatus).toBe('verified');

      // Submit a 1-star negative review
      await reviewService.submitReview({
        providerId: 'demo-prov-001',
        userId: 'user-critical-123',
        authorName: 'Critical Patient',
        reviewData: {
          rating: 1,
          title: 'Long wait times on Monday',
          comment: 'Waiting room was packed and delayed by 45 minutes.',
        },
      });

      const providerAfter = await providerRepo.getProviderById('demo-prov-001');
      // Medical council credential verification MUST remain intact!
      expect(providerAfter!.verificationStatus).toBe('verified');
      expect(providerAfter!.verificationStatus).toBe(initialVerificationStatus);
    });
  });

  describe('6. Provider Responses & Authorization', () => {
    it('allows provider to post an official response to a review on their profile', async () => {
      const reviews = await reviewRepo.getReviewsByProviderId('demo-prov-001');
      const targetReview = reviews[0];

      const updated = await reviewService.respondToReview({
        reviewId: targetReview.id,
        providerUserId: 'user-prov-001',
        responderName: 'Dr. Ananya Mukherjee',
        responseText: 'Thank you for your feedback! We are actively improving weekend scheduling.',
      });

      expect(updated.providerResponse).toBeDefined();
      expect(updated.providerResponse?.responseText).toContain('improving weekend scheduling');
      expect(updated.providerResponse?.responderName).toBe('Dr. Ananya Mukherjee');
    });

    it('rejects response from an unauthorized third-party user', async () => {
      const reviews = await reviewRepo.getReviewsByProviderId('demo-prov-001');
      const targetReview = reviews[0];

      await expect(
        reviewService.respondToReview({
          reviewId: targetReview.id,
          providerUserId: 'unauthorized-user-999',
          responderName: 'Impostor',
          responseText: 'Fake clinic response',
        })
      ).rejects.toThrow(/Unauthorized: You can only respond to reviews on your own provider profile/);
    });
  });

  describe('7. Review Flagging & Admin Moderation', () => {
    it('allows community reporting of a review', async () => {
      const reviews = await reviewRepo.getReviewsByProviderId('demo-prov-001');
      const targetReview = reviews[0];

      const flag = await reviewService.flagReview({
        reviewId: targetReview.id,
        reporterUserId: 'community-reporter',
        reason: 'fake_review',
        details: 'Reviewer never attended the consultation.',
      });

      expect(flag.id).toBeDefined();
      expect(flag.status).toBe('pending');
      expect(flag.reason).toBe('fake_review');

      const reviewAfter = await reviewRepo.getReviewById(targetReview.id);
      expect(reviewAfter?.flagCount).toBeGreaterThanOrEqual(1);
    });

    it('allows administrators to moderate review visibility', async () => {
      const reviews = await reviewRepo.getReviewsByProviderId('demo-prov-001');
      const targetReview = reviews[0];

      const hiddenReview = await reviewService.moderateReview({
        reviewId: targetReview.id,
        status: 'hidden',
        moderationReason: 'Temporarily hidden pending legal review.',
      });

      expect(hiddenReview.status).toBe('hidden');
      expect(hiddenReview.moderationReason).toBe('Temporarily hidden pending legal review.');

      // Hidden review should no longer be returned in public queries
      const publicReviews = await reviewService.getProviderReviews('demo-prov-001');
      expect(publicReviews.reviews.some((r) => r.id === targetReview.id)).toBe(false);
    });
  });

  describe('8. Provider Profile Correction Workflow', () => {
    it('submits a provider detail correction report', async () => {
      const report = await reviewService.submitCorrectionReport({
        providerId: 'demo-prov-001',
        reporterUserId: 'concerned-patient',
        reporterRole: 'patient',
        correctionType: 'operating_hours',
        description: 'Saturday clinic begins at 9:30 AM instead of 10:00 AM.',
        suggestedValue: 'Sat: 09:30 - 13:30',
      });

      expect(report.id).toBeDefined();
      expect(report.status).toBe('pending');
      expect(report.correctionType).toBe('operating_hours');
    });

    it('allows admin to resolve a profile correction report', async () => {
      const reports = await reviewRepo.getCorrectionReports('pending');
      expect(reports.length).toBeGreaterThan(0);
      const targetReport = reports[0];

      const resolved = await reviewService.resolveCorrectionReport({
        reportId: targetReport.id,
        status: 'resolved',
        adminNotes: 'Confirmed with clinic front desk and updated operating hours.',
        resolvedByUserId: 'admin-compliance-officer',
      });

      expect(resolved.status).toBe('resolved');
      expect(resolved.adminNotes).toContain('Confirmed with clinic');
      expect(resolved.resolvedByUserId).toBe('admin-compliance-officer');
    });
  });
});
