'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Lock,
  Flag,
  Edit3,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Review,
  ReviewStatus,
  ReviewFlagReport,
  ProviderCorrectionReport,
  CorrectionStatus,
} from '@/shared/types/review';
import { UserPublicProfile } from '@/shared/types/auth';
import { formatDate } from '@/shared/utils/formatters';

export function AdminReviewsPageView() {
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'corrections'>('reviews');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingFlags, setPendingFlags] = useState<ReviewFlagReport[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus | ''>('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  // Corrections state
  const [corrections, setCorrections] = useState<ProviderCorrectionReport[]>([]);
  const [correctionFilter, setCorrectionFilter] = useState<CorrectionStatus | ''>('pending');
  const [selectedCorrection, setSelectedCorrection] = useState<ProviderCorrectionReport | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isResolvingCorrection, setIsResolvingCorrection] = useState(false);

  const loadReviewsData = useCallback(async (status?: string) => {
    try {
      const url = status
        ? `/api/v1/admin/reviews?status=${status}`
        : '/api/v1/admin/reviews';
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setReviews(json.data.reviews || []);
        setPendingFlags(json.data.pendingFlags || []);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const loadCorrectionsData = useCallback(async (status?: string) => {
    try {
      const url = status
        ? `/api/v1/admin/corrections?status=${status}`
        : '/api/v1/admin/corrections';
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setCorrections(json.data || []);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    async function initAdmin() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authJson = await authRes.json();
        if (authJson.data) {
          setCurrentUser(authJson.data);
          if (authJson.data.role === 'admin') {
            await Promise.all([
              loadReviewsData(reviewStatusFilter),
              loadCorrectionsData(correctionFilter),
            ]);
          }
        }
      } catch {
        // Non-blocking
      } finally {
        setIsLoading(false);
      }
    }
    initAdmin();
  }, [reviewStatusFilter, correctionFilter, loadReviewsData, loadCorrectionsData]);

  const handleModerateReview = async (reviewId: string, status: ReviewStatus) => {
    setIsModerating(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          moderationReason: moderationReason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to moderate review');
      }

      setStatusMessage({
        type: 'success',
        text: `Review marked as ${status}.`,
      });
      setSelectedReview(null);
      setModerationReason('');
      await loadReviewsData(reviewStatusFilter);
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error moderating review',
      });
    } finally {
      setIsModerating(false);
    }
  };

  const handleResolveCorrection = async (
    reportId: string,
    status: 'resolved' | 'dismissed'
  ) => {
    setIsResolvingCorrection(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/corrections/${reportId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: correctionNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update correction');
      }

      setStatusMessage({
        type: 'success',
        text: `Profile correction marked as ${status}.`,
      });
      setSelectedCorrection(null);
      setCorrectionNotes('');
      await loadCorrectionsData(correctionFilter);
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error resolving correction',
      });
    } finally {
      setIsResolvingCorrection(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-xs space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Access Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The reviews and trust moderation dashboard is restricted to verified DocNearby compliance administrators.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
        >
          Sign in as Administrator
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Reviews & Trust Moderation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review patient feedback, moderate community flags, and verify provider profile corrections.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'reviews'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            <span>Reviews ({reviews.length})</span>
            {pendingFlags.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('corrections')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'corrections'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-600" />
            <span>Profile Corrections ({corrections.length})</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter status:</span>
              <select
                value={reviewStatusFilter}
                onChange={(e) =>
                  setReviewStatusFilter(e.target.value as ReviewStatus | '')
                }
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">All Reviews</option>
                <option value="pending_moderation">Pending Moderation</option>
                <option value="flagged">Flagged by Community</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadReviewsData(reviewStatusFilter)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Review List */}
            <div className="lg:col-span-2 space-y-3">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-3xl">
                  No reviews match the current status filter.
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => {
                      setSelectedReview(rev);
                      setModerationReason(rev.moderationReason || '');
                    }}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer bg-white ${
                      selectedReview?.id === rev.id
                        ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              rev.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rev.status === 'pending_moderation'
                                ? 'bg-amber-100 text-amber-800'
                                : rev.status === 'flagged'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rev.status.replace('_', ' ')}
                          </span>

                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  rev.rating >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>

                          {rev.isVerifiedPatient && (
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                              Verified Patient
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {rev.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {rev.comment}
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>

                    {rev.moderationReason && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{rev.moderationReason}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Selected Review Moderation Action Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Moderation Action
              </h3>

              {selectedReview ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Author</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReview.authorName} ({selectedReview.userId})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Provider ID</span>
                    <span className="font-mono text-slate-700">
                      {selectedReview.providerId}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Full Review</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl mt-1 text-[11px] leading-relaxed">
                      &ldquo;{selectedReview.comment}&rdquo;
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Moderation Reason / Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional explanation for audit log..."
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isModerating}
                      onClick={() =>
                        handleModerateReview(selectedReview.id, 'published')
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Publish
                    </button>

                    <button
                      type="button"
                      disabled={isModerating}
                      onClick={() =>
                        handleModerateReview(selectedReview.id, 'hidden')
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold transition-colors shadow-2xs"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide
                    </button>

                    <button
                      type="button"
                      disabled={isModerating}
                      onClick={() =>
                        handleModerateReview(selectedReview.id, 'rejected')
                      }
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-2xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Review
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Select a review from the left to view details and take moderation action.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE CORRECTIONS */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter status:</span>
              <select
                value={correctionFilter}
                onChange={(e) =>
                  setCorrectionFilter(e.target.value as CorrectionStatus | '')
                }
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">All Corrections</option>
                <option value="pending">Pending Verification</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadCorrectionsData(correctionFilter)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Corrections List */}
            <div className="lg:col-span-2 space-y-3">
              {corrections.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-3xl">
                  No profile corrections match the current filter.
                </div>
              ) : (
                corrections.map((corr) => (
                  <div
                    key={corr.id}
                    onClick={() => {
                      setSelectedCorrection(corr);
                      setCorrectionNotes(corr.adminNotes || '');
                    }}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer bg-white ${
                      selectedCorrection?.id === corr.id
                        ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              corr.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : corr.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {corr.status}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                            {corr.correctionType.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {corr.providerName}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          {corr.description}
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDate(corr.createdAt)}
                      </span>
                    </div>

                    {corr.suggestedValue && (
                      <div className="mt-2 text-[11px] font-mono bg-slate-50 px-3 py-1.5 rounded-xl text-teal-800 border border-slate-100">
                        Suggested: {corr.suggestedValue}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Selected Correction Resolution Action Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Correction Resolution
              </h3>

              {selectedCorrection ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Provider</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCorrection.providerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Discrepancy</span>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl mt-1 text-[11px]">
                      {selectedCorrection.description}
                    </p>
                  </div>

                  {selectedCorrection.suggestedValue && (
                    <div>
                      <span className="text-slate-500 block text-[11px]">Suggested Value</span>
                      <p className="font-mono text-teal-800 bg-teal-50/60 p-2.5 rounded-xl mt-1 text-[11px]">
                        {selectedCorrection.suggestedValue}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Admin Resolution Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Notes regarding clinic verification check..."
                      value={correctionNotes}
                      onChange={(e) => setCorrectionNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isResolvingCorrection}
                      onClick={() =>
                        handleResolveCorrection(selectedCorrection.id, 'resolved')
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>

                    <button
                      type="button"
                      disabled={isResolvingCorrection}
                      onClick={() =>
                        handleResolveCorrection(selectedCorrection.id, 'dismissed')
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Select a correction from the left to view discrepancy details and take resolution action.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

