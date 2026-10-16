'use client';

import React, { useState } from 'react';
import { Edit3, X, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { CorrectionType } from '@/shared/types/review';

interface ProviderCorrectionModalProps {
  providerId: string;
  providerName: string;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionSubmitted?: () => void;
}

export function ProviderCorrectionModal({
  providerId,
  providerName,
  isOpen,
  onClose,
  onCorrectionSubmitted,
}: ProviderCorrectionModalProps) {
  const [correctionType, setCorrectionType] = useState<CorrectionType>('operating_hours');
  const [description, setDescription] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/v1/providers/${providerId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          correctionType,
          description: description.trim(),
          suggestedValue: suggestedValue.trim() || undefined,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to submit correction');
      }

      setSuccess(true);
      setTimeout(() => {
        onCorrectionSubmitted?.();
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
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 text-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold">
            <Edit3 className="w-3 h-3 text-teal-600" />
            Accuracy & Verification Support
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Suggest Profile Correction
          </h3>
          <p className="text-xs text-slate-500">
            Help us maintain accurate healthcare information for <strong className="text-slate-700">{providerName}</strong>.
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
            <h4 className="text-sm font-bold text-slate-900">Correction Report Submitted</h4>
            <p className="text-xs text-slate-600">
              Our verification team will confirm these details with the healthcare facility and update the registry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Correction Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
              >
                <option value="operating_hours">Operating Hours / Consultation Timing</option>
                <option value="address_location">Address, Floor, or Geographic Location</option>
                <option value="contact_info">Phone Number, Reception Contact, or Email</option>
                <option value="qualifications">Degrees, Specialization, or Credentials</option>
                <option value="languages">Spoken Languages</option>
                <option value="provider_inactive">Doctor or Clinic is Relocated or Inactive</option>
                <option value="other">Other Information Correction</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Describe the Discrepancy <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={3}
                placeholder="What is currently inaccurate on this profile? (e.g. clinic opens at 9:30 AM on Saturdays, or doctor has relocated to 2nd floor)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Suggested Correct Value (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sat: 09:30 - 13:30 or +91 33 2244 5566"
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Your Contact Email (Optional, for verification questions)
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                All profile corrections are verified by the DocNearby compliance team against official clinic sources before any changes take effect on the live directory.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || description.trim().length < 10}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Profile Correction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

