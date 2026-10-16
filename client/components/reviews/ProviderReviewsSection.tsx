'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ShieldCheck,
  Clock,
  ThumbsUp,
  AlertCircle,
  Flag,
  MessageSquare,
  Edit3,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Review, ProviderRatingSummary } from '@/shared/types/review';
import { formatDate } from '@/shared/utils/formatters';
import { WriteReviewModal } from './WriteReviewModal';
import { FlagReviewModal } from './FlagReviewModal';
import { ProviderCorrectionModal } from './ProviderCorrectionModal';

interface ProviderReviewsSectionProps {
  providerId: string;
  providerName: string;
}

export function ProviderReviewsSection({
  providerId,
  providerName,
}: ProviderReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ProviderRatingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [flaggingReview, setFlaggingReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/providers/${providerId}/reviews`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to load reviews');
      }
      setReviews(json.data.reviews || []);
      setSummary(json.data.ratingSummary || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading reviews');
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <section aria-label="Patient Reviews and Trust" className="space-y-6">
      {/* 1. Explicit Statutory Separation Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Important Healthcare Trust & Regulatory Separation Notice
          </p>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            Patient reviews reflect individual traveler communication and clinic experiences. Reviews do <strong>NOT</strong> constitute medical advice, clinical quality certification, or statutory medical registration. DocNearby verifies medical qualifications separately against official government registers.
          </p>
        </div>
      </div>

      {/* 2. Rating Summary & Actions Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Patient Feedback & Ratings
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {summary ? `${summary.totalReviews} Reviews` : '0 Reviews'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Feedback from travelers and local patients who visited {providerName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Suggest Profile Correction</span>
            </button>
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Write a Patient Review</span>
            </button>
          </div>
        </div>

        {/* Aggregate Ratings Breakdown */}
        {summary && summary.totalReviews > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Average Score */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 text-center">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {summary.averageRating}
              </span>
              <div className="flex items-center gap-1 my-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      Math.round(summary.averageRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Based on {summary.totalReviews} verified patient ratings
              </span>
            </div>

            {/* Rating Bars Distribution */}
            <div className="space-y-1.5 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((score) => {
                const count = summary.ratingDistribution[score as keyof typeof summary.ratingDistribution] || 0;
                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                return (
                  <div key={score} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-5 font-semibold text-right">{score}★</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 text-[10px] text-slate-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Travel Health Criteria Breakdown */}
            <div className="grid grid-cols-1 gap-2.5 justify-center flex flex-col">
              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                <span className="text-xs font-medium text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Verified Appointments
                </span>
                <span className="text-xs font-bold text-teal-800">
                  {summary.verifiedPatientReviewCount} / {summary.totalReviews}
                </span>
              </div>

              {typeof summary.averageWaitTimeMinutes === 'number' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Average Wait Time
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    ~{summary.averageWaitTimeMinutes} min
                  </span>
                </div>
              )}

              {typeof summary.priceAccuracyRate === 'number' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                    Price Accuracy
                  </span>
                  <span className="text-xs font-bold text-teal-700">
                    {summary.priceAccuracyRate}% accurate
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-6 text-center text-xs text-slate-500 space-y-1">
            <p>No patient reviews recorded yet for {providerName}.</p>
            <p className="text-[11px] text-slate-400">
              Be the first traveler or patient to share your experience!
            </p>
          </div>
        )}
      </div>

      {/* 3. Published Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-slate-100 rounded-3xl" />
            <div className="h-32 bg-slate-100 rounded-3xl" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-xs">
            {error}
          </div>
        ) : reviews.length === 0 ? null : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3.5"
            >
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          rev.rating >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="font-bold text-slate-900 text-sm">
                    {rev.title}
                  </span>

                  {rev.isVerifiedPatient && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                      title="This patient completed a verified consultation booking via DocNearby"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Patient
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{rev.authorName}</span>
                  <span>•</span>
                  <span>{formatDate(rev.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => setFlaggingReview(rev)}
                    className="p-1 hover:text-rose-600 transition-colors ml-1"
                    title="Report or flag this review"
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sub-ratings chips */}
              <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-600">
                {typeof rev.waitTimeMinutes === 'number' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Wait: ~{rev.waitTimeMinutes}m
                  </span>
                )}
                {typeof rev.languageSatisfaction === 'number' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100">
                    Language Communication: {rev.languageSatisfaction}/5
                  </span>
                )}
                {typeof rev.cleanlinessRating === 'number' && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100">
                    Cleanliness: {rev.cleanlinessRating}/5
                  </span>
                )}
                {rev.priceAccuracy && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100">
                    Fee As Listed ✓
                  </span>
                )}
                {rev.visitDate && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400">
                    Visit: {rev.visitDate}
                  </span>
                )}
              </div>

              {/* Comment Body */}
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>

              {/* Provider Response Block */}
              {rev.providerResponse && (
                <div className="mt-3 p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-teal-900">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      Response from {rev.providerResponse.responderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {formatDate(rev.providerResponse.respondedAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs italic leading-relaxed">
                    &ldquo;{rev.providerResponse.responseText}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <WriteReviewModal
        providerId={providerId}
        providerName={providerName}
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onReviewSubmitted={fetchReviews}
      />

      <ProviderCorrectionModal
        providerId={providerId}
        providerName={providerName}
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
      />

      {flaggingReview && (
        <FlagReviewModal
          providerId={providerId}
          reviewId={flaggingReview.id}
          reviewTitle={flaggingReview.title}
          isOpen={true}
          onClose={() => setFlaggingReview(null)}
          onFlagSubmitted={fetchReviews}
        />
      )}
    </section>
  );
}

