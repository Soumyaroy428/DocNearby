'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { ProviderSubmission, SubmissionStatus } from '@/shared/types/provider';
import { UserPublicProfile } from '@/shared/types/auth';

export function AdminVerificationPageView() {
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [submissions, setSubmissions] = useState<ProviderSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ProviderSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('pending_review');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Form State
  const [evidenceType, setEvidenceType] = useState('state_medical_council_registration');
  const [whatWasChecked, setWhatWasChecked] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Suspension / Reinstatement tool state
  const [providerIdToManage, setProviderIdToManage] = useState('');
  const [manageAction, setManageAction] = useState<'suspend' | 'reinstate'>('suspend');
  const [manageReason, setManageReason] = useState('');
  const [isManagingProvider, setIsManagingProvider] = useState(false);

  useEffect(() => {
    async function initAdmin() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authJson = await authRes.json();
        if (authJson.data) {
          setCurrentUser(authJson.data);
          if (authJson.data.role === 'admin') {
            loadSubmissions(statusFilter);
          }
        }
      } catch {
        // Handle unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    initAdmin();
  }, [statusFilter]);

  const loadSubmissions = async (status?: string) => {
    try {
      const url = status ? `/api/v1/admin/submissions?status=${status}` : '/api/v1/admin/submissions';
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setSubmissions(json.data);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleReviewDecision = async (decision: 'approved' | 'rejected' | 'requires_correction') => {
    if (!selectedSubmission) return;
    setIsSubmittingReview(true);
    setStatusMessage(null);

    try {
      const payload = {
        decision,
        evidenceType,
        whatWasChecked: whatWasChecked || `Verified registration reference against official statutory registry.`,
        reviewNotes: reviewNotes || `Decision: ${decision}`,
      };

      const res = await fetch(`/api/v1/admin/submissions/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to complete review.');
      }

      setStatusMessage({
        type: 'success',
        text: `Application ${selectedSubmission.id} was successfully marked as ${decision}.`,
      });

      setSelectedSubmission(null);
      setWhatWasChecked('');
      setReviewNotes('');
      loadSubmissions(statusFilter);
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error processing review action.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleManageProviderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerIdToManage.trim()) return;

    setIsManagingProvider(true);
    setStatusMessage(null);

    try {
      const payload =
        manageAction === 'suspend'
          ? { reason: manageReason || 'Temporary administrative suspension' }
          : { action: 'reinstate', whatWasChecked: manageReason || 'Re-verified statutory credentials' };

      const res = await fetch(`/api/v1/admin/providers/${providerIdToManage.trim()}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to update provider status.');
      }

      setStatusMessage({
        type: 'success',
        text: `Provider ${providerIdToManage} was successfully ${manageAction === 'suspend' ? 'suspended' : 'reinstated'}.`,
      });
      setProviderIdToManage('');
      setManageReason('');
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to execute status update.',
      });
    } finally {
      setIsManagingProvider(false);
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
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Administrator Access Required</h1>
        <p className="text-xs text-slate-600">
          This portal is reserved for authorized DocNearby Trust Operations personnel to verify healthcare credentials against statutory registers.
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 text-left">
          <p className="font-semibold text-slate-800">Demo Testing Administrator Account:</p>
          <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
            Email: <strong>admin@docnearby.example.com</strong>
          </div>
          <p className="text-[11px] text-slate-400">
            Sign in with an administrator account to review provider applications.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Sign In with Admin Account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            DocNearby Trust Operations & Credential Registry
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Provider Verification Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Audit, verify, and govern healthcare provider applications against statutory state and national medical registers.
          </p>
        </div>

        <button
          onClick={() => loadSubmissions(statusFilter)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-2.5 text-xs shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
            {(
              [
                { label: 'Pending Review', value: 'pending_review' },
                { label: 'Approved', value: 'approved' },
                { label: 'Corrections Required', value: 'requires_correction' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'All', value: '' },
              ] as { label: string; value: SubmissionStatus | '' }[]
            ).map((item) => (
              <button
                key={item.label}
                onClick={() => setStatusFilter(item.value)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  statusFilter === item.value
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            {submissions.length} {submissions.length === 1 ? 'application' : 'applications'}
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No applications match this filter</h3>
            <p className="text-xs text-slate-500">
              There are currently no provider submissions under this review state.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                  selectedSubmission?.id === sub.id
                    ? 'border-teal-500 ring-2 ring-teal-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-500">#{sub.id}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          sub.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : sub.status === 'pending_review'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {sub.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">Type: {sub.providerType}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{sub.displayName}</h3>
                    <p className="text-xs text-slate-600">
                      Applicant: <strong>{sub.applicantName}</strong> ({sub.applicantRole}) —{' '}
                      <span className="text-slate-500">{sub.applicantEmail}</span>
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span>Reg No:</span>
                        <strong className="text-slate-800">{sub.registrationReference}</strong>
                      </div>
                      <div className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Authority: <strong className="text-slate-800">{sub.authorityName}</strong>
                      </div>
                      <div className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        City: <strong className="text-slate-800">{sub.locality}, {sub.city}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setWhatWasChecked(
                        `Checked ${sub.registrationReference} against ${sub.authorityName} statutory registry for good standing.`
                      );
                      setReviewNotes('');
                    }}
                    className="px-3.5 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap self-start"
                  >
                    {selectedSubmission?.id === sub.id ? 'Reviewing' : 'Review Credentials'}
                  </button>
                </div>

                {/* Inline Review Action Form if Selected */}
                {selectedSubmission?.id === sub.id && (
                  <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      Evidence Verification Audit Form for {sub.displayName}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Verification Evidence Type</label>
                        <select
                          value={evidenceType}
                          onChange={(e) => setEvidenceType(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                        >
                          <option value="state_medical_council_registration">
                            State Medical Council Registration
                          </option>
                          <option value="national_medical_commission">
                            National Medical Commission (NMC) Registry
                          </option>
                          <option value="clinical_establishment_license">
                            Clinical Establishment Act License
                          </option>
                          <option value="radiology_diagnostic_accreditation">
                            Diagnostic Accreditation (AERB/NABL)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">What was checked in official registry</label>
                        <input
                          type="text"
                          value={whatWasChecked}
                          onChange={(e) => setWhatWasChecked(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-slate-700">Audit / Review Notes (Private internal record)</label>
                        <textarea
                          rows={2}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="e.g. Verified registration certificate matches council database; qualifications confirmed."
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={() => handleReviewDecision('approved')}
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve & Publish Listing
                      </button>

                      <button
                        onClick={() => handleReviewDecision('requires_correction')}
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Request Corrections
                      </button>

                      <button
                        onClick={() => handleReviewDecision('rejected')}
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Application
                      </button>

                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suspension & Reinstatement Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            Provider Suspension & Re-verification Governance
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Temporarily suspend disputed or flagged provider listings pending re-verification, or reinstate verified listings.
        </p>

        <form onSubmit={handleManageProviderStatus} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Provider ID</label>
            <input
              type="text"
              required
              value={providerIdToManage}
              onChange={(e) => setProviderIdToManage(e.target.value)}
              placeholder="e.g. demo-prov-001"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Action</label>
            <select
              value={manageAction}
              onChange={(e) => setManageAction(e.target.value as 'suspend' | 'reinstate')}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
            >
              <option value="suspend">Suspend Listing</option>
              <option value="reinstate">Reinstate Listing</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Governance Reason / Audit Check</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={manageReason}
                onChange={(e) => setManageReason(e.target.value)}
                placeholder={
                  manageAction === 'suspend'
                    ? 'e.g. Credential dispute filed by regulatory board'
                    : 'e.g. Rechecked license status on active medical register'
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
              />
              <button
                type="submit"
                disabled={isManagingProvider}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl whitespace-nowrap shadow-xs transition-colors ${
                  manageAction === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isManagingProvider ? 'Processing...' : manageAction === 'suspend' ? 'Suspend' : 'Reinstate'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

