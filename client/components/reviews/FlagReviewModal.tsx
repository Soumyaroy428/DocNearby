'use client';

import React, { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle } from 'lucide-react';
import { ReviewFlagReason } from '@/shared/types/review';

interface FlagReviewModalProps {
  providerId: string;
  reviewId: string;
  reviewTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onFlagSubmitted?: () => void;
}

export function FlagReviewModal({
  providerId,
  reviewId,
  reviewTitle,
  isOpen,
  onClose,
  onFlagSubmitted,
}: FlagReviewModalProps) {
  const [reason, setReason] = useState<ReviewFlagReason>('fake_review');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/providers/${providerId}/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        onFlagSubmitted?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
            <Flag className="w-3 h-3 text-rose-600" />
            Report Patient Review
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Report Concern
          </h3>
          <p className="text-xs text-slate-500">
            Reporting review: &ldquo;<span className="italic">{reviewTitle}</span>&rdquo;
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-teal-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Report Received</h4>
            <p className="text-xs text-slate-600">
              Our moderation team will review this report against our Community Trust Guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Reason for Reporting <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReviewFlagReason)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              >
                <option value="fake_review">Fake review or unverified encounter</option>
                <option value="offensive">Harassment, hate speech, or profanity</option>
                <option value="pii_leak">Contains personal phone numbers, emails, or IDs</option>
                <option value="spam">Commercial advertisement or spam</option>
                <option value="conflict_of_interest">Conflict of interest or competitor attack</option>
                <option value="other">Other violation of trust standards</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Specific Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="Explain why this review violates trust guidelines..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || details.trim().length < 5}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

