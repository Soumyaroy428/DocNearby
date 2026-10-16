'use client';

import React, { useState } from 'react';
import { X, IndianRupee, AlertCircle, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Provider, ServicePrice } from '@/shared/types/provider';

interface PriceReportModalProps {
  provider: Provider;
  service?: ServicePrice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PriceReportModal({
  provider,
  service,
  isOpen,
  onClose,
  onSuccess,
}: PriceReportModalProps) {
  const [serviceName, setServiceName] = useState(service?.serviceName || 'General Consultation');
  const [observedRupees, setObservedRupees] = useState(
    service ? String(service.amountMinor / 100) : ''
  );
  const [observedDate, setObservedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const rupees = parseFloat(observedRupees);
    if (isNaN(rupees) || rupees <= 0) {
      setError('Please enter a valid consultation fee in Rupees.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/providers/${provider.id}/price-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          providerName: provider.displayName,
          serviceId: service?.id,
          serviceName,
          reportedAmountMinor: Math.round(rupees * 100),
          currency: 'INR',
          observedDate,
          evidenceOrReceiptNotes: notes,
          reporterEmail: reporterEmail || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to submit price report.');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Report Inaccurate or Changed Price
              </h3>
              <p className="text-[11px] text-slate-500">{provider.displayName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Price Report Submitted</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Thank you for helping keep healthcare transparent. Our operations team reviews all reported fee revisions against official receipts before updating directory listings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Healthcare Service</label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. General Consultation, Follow-up"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                  Observed Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={observedRupees}
                  onChange={(e) => setObservedRupees(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Date Observed</label>
                <input
                  type="date"
                  required
                  value={observedDate}
                  onChange={(e) => setObservedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                Receipt / Verification Notes (min 10 characters)
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe how you observed this fee (e.g., printed clinic receipt, reception tariff card, additional registration charges charged on-site)."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Your Email (Optional, for review updates)</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              <strong>Transparent Care Safeguard:</strong> DocNearby never modifies public prices automatically. Every community submission is checked by Trust Operations before approval.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
