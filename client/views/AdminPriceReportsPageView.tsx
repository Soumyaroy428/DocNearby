'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Lock,
  ArrowRight,
  IndianRupee,
  Calendar,
  FileText,
  UserCheck,
} from 'lucide-react';
import { PriceCorrectionReport, PriceCorrectionStatus } from '@/shared/types/provider';
import { UserPublicProfile } from '@/shared/types/auth';
import { formatPaiseToRupees, formatDate, formatRelativeTime } from '@/shared/utils/formatters';

export function AdminPriceReportsPageView() {
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [reports, setReports] = useState<PriceCorrectionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PriceCorrectionReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<PriceCorrectionStatus | ''>('pending_review');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resolution Form State
  const [decision, setDecision] = useState<'accepted' | 'dismissed'>('accepted');
  const [updateProviderPrice, setUpdateProviderPrice] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    async function initAdmin() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authJson = await authRes.json();
        if (authJson.data) {
          setCurrentUser(authJson.data);
          if (authJson.data.role === 'admin') {
            loadReports(statusFilter);
          }
        }
      } catch {
        // Non-blocking
      } finally {
        setIsLoading(false);
      }
    }
    initAdmin();
  }, [statusFilter]);

  const loadReports = async (status?: string) => {
    try {
      const url = status ? `/api/v1/admin/price-reports?status=${status}` : '/api/v1/admin/price-reports';
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setReports(json.data);
        if (selectedReport) {
          const updated = json.data.find((r: PriceCorrectionReport) => r.id === selectedReport.id);
          setSelectedReport(updated || null);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsSubmittingResolution(true);
    setStatusMessage(null);

    try {
      const payload = {
        decision,
        reviewNotes: adminNotes || `Resolution marked as ${decision} by Trust Operations.`,
        updateProviderPrice: decision === 'accepted' ? updateProviderPrice : false,
      };

      const res = await fetch(`/api/v1/admin/price-reports/${selectedReport.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to resolve price report.');
      }

      setStatusMessage({
        type: 'success',
        text: `Report ${selectedReport.id} successfully marked as ${decision.toUpperCase()}${
          decision === 'accepted' && updateProviderPrice ? ' and public directory price updated.' : '.'
        }`,
      });

      setAdminNotes('');
      await loadReports(statusFilter);
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred during resolution.',
      });
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Checking credentials & loading reports...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Admin Access</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Access to DocNearby Price Transparency Audits is restricted to authorized platform administrators.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <span>Sign In as Admin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
              Trust Operations
            </span>
            <span className="text-xs text-slate-500">Logged in as {currentUser.name}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Price Discrepancy Audits & Corrections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review patient-reported consultation fee discrepancies and update stale directory rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/verification"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Verifications</span>
          </Link>
          <button
            type="button"
            onClick={() => loadReports(statusFilter)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Banners */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('pending_review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'pending_review'
              ? 'bg-amber-100 text-amber-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Review
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('accepted')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'accepted'
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Accepted
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('dismissed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'dismissed'
              ? 'bg-slate-200 text-slate-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dismissed
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === ''
              ? 'bg-teal-100 text-teal-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Reports
        </button>
      </div>

      {/* Main Grid: List on Left, Resolution View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Reports Queue ({reports.length})
          </div>

          {reports.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
              No price reports matching filter: <strong>{statusFilter || 'all'}</strong>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setStatusMessage(null);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">
                        {report.providerName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          report.status === 'pending_review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : report.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mb-2">
                      Service: <strong className="text-slate-800">{report.serviceName}</strong>
                    </div>

                    <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Listed</span>
                        <span className="font-bold text-slate-700">
                          {report.listedAmountMinor ? formatPaiseToRupees(report.listedAmountMinor) : 'N/A'}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Reported</span>
                        <span className="font-black text-rose-600">
                          {formatPaiseToRupees(report.reportedAmountMinor)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[150px]">{report.reporterEmail || 'Community Traveler'}</span>
                      <span>{formatRelativeTime(report.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Report Inspection & Resolution Form */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{selectedReport.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedReport.status === 'pending_review'
                          ? 'bg-amber-100 text-amber-900'
                          : selectedReport.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    {selectedReport.providerName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Discrepancy reported for: <strong>{selectedReport.serviceName}</strong>
                  </p>
                </div>

                <Link
                  href={`/providers/${selectedReport.providerId}`}
                  target="_blank"
                  className="text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  View Directory Card
                </Link>
              </div>

              {/* Fee Comparison Summary Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Public Directory Consultation Fee
                  </span>
                  <span className="text-xl font-bold text-slate-900">
                    {selectedReport.listedAmountMinor ? formatPaiseToRupees(selectedReport.listedAmountMinor) : 'Not recorded'}
                  </span>
                </div>
                <div className="space-y-1 border-l border-slate-200 pl-4">
                  <span className="text-xs font-semibold text-rose-600 block">
                    Patient Observed / Charged Fee
                  </span>
                  <span className="text-xl font-black text-rose-600">
                    {formatPaiseToRupees(selectedReport.reportedAmountMinor)}
                  </span>
                  {selectedReport.listedAmountMinor !== undefined && (
                    <span className="text-[10px] text-slate-500 block">
                      Difference: {selectedReport.reportedAmountMinor > selectedReport.listedAmountMinor ? '+' : ''}
                      {formatPaiseToRupees(selectedReport.reportedAmountMinor - selectedReport.listedAmountMinor)}
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence & Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Report Evidence & Traveler Context
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium">Observed Visit Date</span>
                    <p className="font-semibold text-slate-800">
                      {selectedReport.observedDate}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium">Reporter Contact</span>
                    <p className="font-semibold text-slate-800 truncate">
                      {selectedReport.reporterEmail || selectedReport.submittedByUserId || 'Anonymous Community Traveler'}
                    </p>
                  </div>
                </div>

                {selectedReport.evidenceOrReceiptNotes && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Receipt Evidence / Contextual Notes</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed italic">
                      &quot;{selectedReport.evidenceOrReceiptNotes}&quot;
                    </p>
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted on {formatDate(selectedReport.createdAt)}</span>
                </div>
              </div>

              {/* Previous Resolution details if already resolved */}
              {selectedReport.status !== 'pending_review' && (
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    <span>Resolution Record</span>
                  </div>
                  <p className="text-slate-700">
                    Reviewed by <strong>{selectedReport.reviewedByUserId || 'Admin'}</strong> on{' '}
                    {selectedReport.reviewedAt ? formatDate(selectedReport.reviewedAt) : 'N/A'}.
                  </p>
                  {selectedReport.reviewNotes && (
                    <p className="text-slate-600 italic">
                      &quot;{selectedReport.reviewNotes}&quot;
                    </p>
                  )}
                </div>
              )}

              {/* Administrative Resolution Form */}
              <form onSubmit={handleResolve} className="pt-4 border-t border-slate-100 space-y-4">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audit Decision & Resolution
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDecision('accepted');
                      setUpdateProviderPrice(true);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      decision === 'accepted'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecision('dismissed');
                      setUpdateProviderPrice(false);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      decision === 'dismissed'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss Report</span>
                  </button>
                </div>

                {decision === 'accepted' && (
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateProviderPrice}
                      onChange={(e) => setUpdateProviderPrice(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs text-emerald-950">
                      <span className="font-bold block">
                        Update Provider Listing Fee to {formatPaiseToRupees(selectedReport.reportedAmountMinor)}
                      </span>
                      <span className="text-[11px] text-emerald-800 leading-relaxed block">
                        Overwrites the current rate with the reported price, resets the freshness confirmation timestamp to now, and tags source as &quot;patient_reported_community&quot;.
                      </span>
                    </div>
                  </label>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audit Review Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter audit notes (e.g. Verified with patient receipt copy or called hospital front desk)..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingResolution ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Audit Resolution...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4" />
                      <span>Confirm {decision === 'accepted' ? 'Acceptance' : 'Dismissal'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400">
              Select a price discrepancy report from the queue to inspect evidence and execute resolution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
