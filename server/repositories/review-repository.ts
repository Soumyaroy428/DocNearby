import {
  Review,
  ReviewStatus,
  ProviderRatingSummary,
  ReviewFlagReport,
  ProviderCorrectionReport,
  CorrectionStatus,
} from '@/shared/types/review';
import { getMongoDb, isMongoConfigured } from '@/server/db/mongodb';
import { Db } from 'mongodb';

async function getDbSafely(): Promise<Db | null> {
  if (!isMongoConfigured()) return null;
  try {
    return await getMongoDb();
  } catch {
    return null;
  }
}

export interface IReviewRepository {
  createReview(
    reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'flagCount'>
  ): Promise<Review>;
  getReviewById(id: string): Promise<Review | null>;
  getReviewsByProviderId(
    providerId: string,
    options?: { includeUnpublished?: boolean }
  ): Promise<Review[]>;
  getUserReviews(userId: string): Promise<Review[]>;
  findRecentUserReviewForProvider(
    userId: string,
    providerId: string,
    daysWindow: number
  ): Promise<Review | null>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | null>;
  getAllReviews(status?: ReviewStatus): Promise<Review[]>;
  getProviderRatingSummary(providerId: string): Promise<ProviderRatingSummary>;

  // Flags & Moderation
  createReviewFlag(
    flagData: Omit<ReviewFlagReport, 'id' | 'createdAt'>
  ): Promise<ReviewFlagReport>;
  getReviewFlags(status?: 'pending' | 'resolved' | 'dismissed'): Promise<ReviewFlagReport[]>;
  updateReviewFlag(
    id: string,
    updates: Partial<ReviewFlagReport>
  ): Promise<ReviewFlagReport | null>;

  // Provider Profile Corrections
  createCorrectionReport(
    data: Omit<ProviderCorrectionReport, 'id' | 'createdAt'>
  ): Promise<ProviderCorrectionReport>;
  getCorrectionReports(status?: CorrectionStatus): Promise<ProviderCorrectionReport[]>;
  getCorrectionReportById(id: string): Promise<ProviderCorrectionReport | null>;
  updateCorrectionReport(
    id: string,
    updates: Partial<ProviderCorrectionReport>
  ): Promise<ProviderCorrectionReport | null>;
}

export class MemoryReviewRepository implements IReviewRepository {
  private reviews: Review[] = [];
  private flags: ReviewFlagReport[] = [];
  private corrections: ProviderCorrectionReport[] = [];

  constructor() {
    this.seedDemoReviews();
  }

  private seedDemoReviews() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 86400000 * 25).toISOString();
    const twoMonthsAgo = new Date(now.getTime() - 86400000 * 50).toISOString();

    this.reviews = [
      {
        id: 'rev-demo-001',
        providerId: 'demo-prov-001',
        userId: 'user-traveler-001',
        authorName: 'Sarah Jenkins',
        rating: 5,
        title: 'Compassionate care, fluent English & clear pricing',
        comment:
          'Visited Dr. Mukherjee while traveling through Kolkata for a sudden allergic skin reaction. The clinic was very clean, staff was courteous, and Dr. Mukherjee explained everything clearly in English. Consultation fee was exactly ₹800 as listed.',
        waitTimeMinutes: 15,
        languageSatisfaction: 5,
        cleanlinessRating: 5,
        priceAccuracy: true,
        visitDate: '2026-09',
        isVerifiedPatient: true,
        status: 'published',
        flagCount: 0,
        providerResponse: {
          responseText:
            'Thank you Sarah! We are delighted that you had a smooth visit and recovered well during your travels in Kolkata.',
          respondedAt: oneMonthAgo,
          respondedByUserId: 'user-prov-001',
          responderName: 'Dr. Ananya Mukherjee',
        },
        createdAt: oneMonthAgo,
        updatedAt: oneMonthAgo,
      },
      {
        id: 'rev-demo-002',
        providerId: 'demo-prov-001',
        userId: 'user-traveler-002',
        authorName: 'Amitav Ghosh',
        rating: 4,
        title: 'Very knowledgeable doctor, slight wait time',
        comment:
          'Doctor is thorough and gentle with pediatric dermatology. Waiting room was slightly crowded on Saturday morning, but consultation was detailed and helpful.',
        waitTimeMinutes: 35,
        languageSatisfaction: 5,
        cleanlinessRating: 4,
        priceAccuracy: true,
        visitDate: '2026-08',
        isVerifiedPatient: false,
        status: 'published',
        flagCount: 0,
        createdAt: twoMonthsAgo,
        updatedAt: twoMonthsAgo,
      },
      {
        id: 'rev-demo-003',
        providerId: 'demo-prov-002',
        userId: 'user-traveler-003',
        authorName: 'Elena Rostova',
        rating: 5,
        title: 'Excellent international patient communication',
        comment:
          'Comprehensive cardiac checkup. The facility receptionist spoke clear English and the doctor gave reassuring, evidence-based guidance without unnecessary tests.',
        waitTimeMinutes: 20,
        languageSatisfaction: 5,
        cleanlinessRating: 5,
        priceAccuracy: true,
        visitDate: '2026-09',
        isVerifiedPatient: true,
        status: 'published',
        flagCount: 0,
        createdAt: oneMonthAgo,
        updatedAt: oneMonthAgo,
      },
    ];

    this.corrections = [
      {
        id: 'corr-demo-001',
        providerId: 'demo-prov-001',
        providerName: 'Demo Dr. Ananya Mukherjee',
        reporterUserId: 'user-traveler-001',
        reporterRole: 'patient',
        correctionType: 'operating_hours',
        description: 'Saturday clinic now opens at 9:30 AM instead of 10:00 AM according to the reception notice.',
        suggestedValue: 'Sat: 09:30 - 13:30',
        status: 'pending',
        createdAt: oneMonthAgo,
      },
    ];
  }

  async createReview(
    reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'flagCount'>
  ): Promise<Review> {
    const db = await getDbSafely();
    const now = new Date().toISOString();
    const id = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const review: Review = {
      ...reviewData,
      id,
      flagCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await db.collection<Review>('reviews').insertOne({ ...review });
      } catch {
        // Fall back to in-memory
      }
    }

    this.reviews.unshift(review);
    return review;
  }

  async getReviewById(id: string): Promise<Review | null> {
    const db = await getDbSafely();
    if (db) {
      try {
        const found = await db.collection<Review>('reviews').findOne({ id });
        if (found) return found;
      } catch {
        // Fall back to in-memory
      }
    }
    return this.reviews.find((r) => r.id === id) || null;
  }

  async getReviewsByProviderId(
    providerId: string,
    options: { includeUnpublished?: boolean } = {}
  ): Promise<Review[]> {
    const db = await getDbSafely();
    if (db) {
      try {
        const query: Record<string, unknown> = { providerId };
        if (!options.includeUnpublished) {
          query.status = 'published';
        }
        const found = await db
          .collection<Review>('reviews')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        if (found.length > 0) return found;
      } catch {
        // Fall back to in-memory
      }
    }

    return this.reviews
      .filter((r) => {
        if (r.providerId !== providerId) return false;
        if (!options.includeUnpublished && r.status !== 'published') return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    const db = await getDbSafely();
    if (db) {
      try {
        const found = await db
          .collection<Review>('reviews')
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();
        if (found.length > 0) return found;
      } catch {
        // Fall back to in-memory
      }
    }

    return this.reviews
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findRecentUserReviewForProvider(
    userId: string,
    providerId: string,
    daysWindow: number
  ): Promise<Review | null> {
    const cutoffDate = new Date(Date.now() - daysWindow * 86400000).toISOString();

    const db = await getDbSafely();
    if (db) {
      try {
        const found = await db.collection<Review>('reviews').findOne({
          userId,
          providerId,
          createdAt: { $gte: cutoffDate },
          status: { $in: ['published', 'pending_moderation', 'flagged'] },
        });
        if (found) return found;
      } catch {
        // Fall back to in-memory
      }
    }

    return (
      this.reviews.find((r) => {
        return (
          r.userId === userId &&
          r.providerId === providerId &&
          new Date(r.createdAt).getTime() >= new Date(cutoffDate).getTime() &&
          ['published', 'pending_moderation', 'flagged'].includes(r.status)
        );
      }) || null
    );
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const db = await getDbSafely();
    const now = new Date().toISOString();
    const mergedUpdates = { ...updates, updatedAt: now };

    if (db) {
      try {
        await db.collection<Review>('reviews').updateOne({ id }, { $set: mergedUpdates });
      } catch {
        // Fall back to memory
      }
    }

    const index = this.reviews.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.reviews[index] = { ...this.reviews[index], ...mergedUpdates };
    return this.reviews[index];
  }

  async getAllReviews(status?: ReviewStatus): Promise<Review[]> {
    const db = await getDbSafely();
    if (db) {
      try {
        const query: Record<string, unknown> = {};
        if (status) query.status = status;
        const found = await db
          .collection<Review>('reviews')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        if (found.length > 0) return found;
      } catch {
        // Fall back to memory
      }
    }

    return this.reviews
      .filter((r) => !status || r.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProviderRatingSummary(providerId: string): Promise<ProviderRatingSummary> {
    const published = await this.getReviewsByProviderId(providerId, { includeUnpublished: false });

    if (published.length === 0) {
      return {
        providerId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPatientReviewCount: 0,
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let waitTimeSum = 0;
    let waitTimeCount = 0;
    let accuratePriceCount = 0;
    let priceRecordedCount = 0;
    let verifiedCount = 0;

    for (const r of published) {
      ratingSum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as keyof typeof distribution]++;
      }
      if (typeof r.waitTimeMinutes === 'number') {
        waitTimeSum += r.waitTimeMinutes;
        waitTimeCount++;
      }
      if (typeof r.priceAccuracy === 'boolean') {
        if (r.priceAccuracy) accuratePriceCount++;
        priceRecordedCount++;
      }
      if (r.isVerifiedPatient) {
        verifiedCount++;
      }
    }

    const averageRating = Number((ratingSum / published.length).toFixed(1));
    const averageWaitTimeMinutes =
      waitTimeCount > 0 ? Math.round(waitTimeSum / waitTimeCount) : undefined;
    const priceAccuracyRate =
      priceRecordedCount > 0
        ? Math.round((accuratePriceCount / priceRecordedCount) * 100)
        : undefined;

    return {
      providerId,
      averageRating,
      totalReviews: published.length,
      ratingDistribution: distribution,
      averageWaitTimeMinutes,
      priceAccuracyRate,
      verifiedPatientReviewCount: verifiedCount,
    };
  }

  // --- Flags & Moderation ---

  async createReviewFlag(
    flagData: Omit<ReviewFlagReport, 'id' | 'createdAt'>
  ): Promise<ReviewFlagReport> {
    const db = await getDbSafely();
    const id = `flag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const flag: ReviewFlagReport = {
      ...flagData,
      id,
      createdAt: now,
    };

    if (db) {
      try {
        await db.collection<ReviewFlagReport>('review_flags').insertOne({ ...flag });
      } catch {
        // Fall back to memory
      }
    }

    this.flags.unshift(flag);

    // Increment flagCount on the review
    const targetReview = await this.getReviewById(flagData.reviewId);
    if (targetReview) {
      const newFlagCount = (targetReview.flagCount || 0) + 1;
      await this.updateReview(flagData.reviewId, {
        flagCount: newFlagCount,
        // Auto-move to 'flagged' if flagged 3+ times
        status: newFlagCount >= 3 ? 'flagged' : targetReview.status,
      });
    }

    return flag;
  }

  async getReviewFlags(status?: 'pending' | 'resolved' | 'dismissed'): Promise<ReviewFlagReport[]> {
    const db = await getDbSafely();
    if (db) {
      try {
        const query: Record<string, unknown> = {};
        if (status) query.status = status;
        const found = await db
          .collection<ReviewFlagReport>('review_flags')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        if (found.length > 0) return found;
      } catch {
        // Fall back to memory
      }
    }

    return this.flags
      .filter((f) => !status || f.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateReviewFlag(
    id: string,
    updates: Partial<ReviewFlagReport>
  ): Promise<ReviewFlagReport | null> {
    const db = await getDbSafely();
    if (db) {
      try {
        await db.collection<ReviewFlagReport>('review_flags').updateOne({ id }, { $set: updates });
      } catch {
        // Fall back to memory
      }
    }

    const index = this.flags.findIndex((f) => f.id === id);
    if (index === -1) return null;

    this.flags[index] = { ...this.flags[index], ...updates };
    return this.flags[index];
  }

  // --- Provider Profile Corrections ---

  async createCorrectionReport(
    data: Omit<ProviderCorrectionReport, 'id' | 'createdAt'>
  ): Promise<ProviderCorrectionReport> {
    const db = await getDbSafely();
    const id = `corr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const correction: ProviderCorrectionReport = {
      ...data,
      id,
      createdAt: now,
    };

    if (db) {
      try {
        await db.collection<ProviderCorrectionReport>('provider_corrections').insertOne({ ...correction });
      } catch {
        // Fall back to memory
      }
    }

    this.corrections.unshift(correction);
    return correction;
  }

  async getCorrectionReports(status?: CorrectionStatus): Promise<ProviderCorrectionReport[]> {
    const db = await getDbSafely();
    if (db) {
      try {
        const query: Record<string, unknown> = {};
        if (status) query.status = status;
        const found = await db
          .collection<ProviderCorrectionReport>('provider_corrections')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();
        if (found.length > 0) return found;
      } catch {
        // Fall back to memory
      }
    }

    return this.corrections
      .filter((c) => !status || c.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getCorrectionReportById(id: string): Promise<ProviderCorrectionReport | null> {
    const db = await getDbSafely();
    if (db) {
      try {
        const found = await db.collection<ProviderCorrectionReport>('provider_corrections').findOne({ id });
        if (found) return found;
      } catch {
        // Fall back to memory
      }
    }

    return this.corrections.find((c) => c.id === id) || null;
  }

  async updateCorrectionReport(
    id: string,
    updates: Partial<ProviderCorrectionReport>
  ): Promise<ProviderCorrectionReport | null> {
    const db = await getDbSafely();
    if (db) {
      try {
        await db.collection<ProviderCorrectionReport>('provider_corrections').updateOne({ id }, { $set: updates });
      } catch {
        // Fall back to memory
      }
    }

    const index = this.corrections.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.corrections[index] = { ...this.corrections[index], ...updates };
    return this.corrections[index];
  }
}

export const reviewRepository = new MemoryReviewRepository();
