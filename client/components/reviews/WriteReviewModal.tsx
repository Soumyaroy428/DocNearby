'use client';

import React, { useState } from 'react';
import { Star, X, AlertCircle, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { ValidatedCreateReview } from '@/server/validation/review';

interface WriteReviewModalProps {
  providerId: string;
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export function WriteReviewModal({
  providerId,
  providerName,
  isOpen,
  onClose,
  onReviewSubmitted,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [waitTimeMinutes, setWaitTimeMinutes] = useState<string>('15');
  const [languageSatisfaction, setLanguageSatisfaction] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [priceAccuracy, setPriceAccuracy] = useState<boolean>(true);
  const [visitDate, setVisitDate] = useState<string>(
    new Date().toISOString().slice(0, 7) // Current YYYY-MM
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: ValidatedCreateReview = {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        waitTimeMinutes: waitTimeMinutes ? parseInt(waitTimeMinutes, 10) : undefined,
        languageSatisfaction,
        cleanlinessRating,
        priceAccuracy,
        visitDate: visitDate || undefined,
      };

      const res = await fetch(`/api/v1/providers/${providerId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to submit review');
      }

      setSuccessMessage(
        json.meta?.message || 'Your review has been submitted successfully.'
      );
      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 my-8 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
            <Star className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
            Patient Experience Feedback
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Review {providerName}
          </h2>
          <p className="text-xs text-slate-500">
            Share honest, constructive feedback to help travelers find appropriate care. Reviews are screened for privacy and safety.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-teal-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Thank You!</h3>
            <p className="text-xs text-slate-600">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Overall Rating */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                Overall Experience Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating === 5 && 'Excellent'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Below Average'}
                  {rating === 1 && 'Poor'}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Review Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Caring doctor, fluent English, clear consultation fee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800 block">
                  Detailed Experience <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {comment.length}/1000 characters (min 10)
                </span>
              </div>
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                placeholder="Describe communication, wait times, clarity of advice, and facility cleanliness. Please do not share personal phone numbers, card details, or medical prescription requests."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            {/* Sub-ratings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Wait Time (Approx. minutes)
                </label>
                <select
                  value={waitTimeMinutes}
                  onChange={(e) => setWaitTimeMinutes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="0">Immediate / Under 5 min</option>
                  <option value="15">~15 minutes</option>
                  <option value="30">~30 minutes</option>
                  <option value="45">~45 minutes</option>
                  <option value="60">1 hour or more</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Language Communication (1-5)
                </label>
                <select
                  value={languageSatisfaction}
                  onChange={(e) => setLanguageSatisfaction(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value={5}>5 — Fully fluent and easy to understand</option>
                  <option value={4}>4 — Good communication</option>
                  <option value={3}>3 — Moderate language barrier</option>
                  <option value={2}>2 — Significant language barrier</option>
                  <option value={1}>1 — Could not communicate</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Clinic Cleanliness (1-5)
                </label>
                <select
                  value={cleanlinessRating}
                  onChange={(e) => setCleanlinessRating(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value={5}>5 — Spotless & very hygienic</option>
                  <option value={4}>4 — Clean & orderly</option>
                  <option value={3}>3 — Acceptable</option>
                  <option value={2}>2 — Needs better hygiene</option>
                  <option value={1}>1 — Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Month of Visit
                </label>
                <input
                  type="month"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            {/* Price Accuracy Checkbox */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
              <input
                type="checkbox"
                id="priceAccuracy"
                checked={priceAccuracy}
                onChange={(e) => setPriceAccuracy(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="priceAccuracy" className="text-[11px] text-slate-700 cursor-pointer">
                <strong>Price Transparency Check:</strong> The consultation fee charged at the facility matched or closely aligned with the fee listed on DocNearby.
              </label>
            </div>

            {/* Trust Policy Notice */}
            <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Healthcare Trust Guarantee:</strong> Reviews reflect personal care experiences and do NOT certify statutory medical credentials. Defamatory allegations, commercial spam, and patient PII are strictly prohibited.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || title.trim().length < 3 || comment.trim().length < 10}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Post Patient Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

