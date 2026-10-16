'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
  MapPin,
  IndianRupee,
  Phone,
} from 'lucide-react';
import { ProviderType } from '@/shared/types/provider';

export function ProviderApplyPageView() {
  const router = useRouter();

  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantRole, setApplicantRole] = useState('Consultant Doctor');
  const [displayName, setDisplayName] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('doctor');
  const [specialtiesStr, setSpecialtiesStr] = useState('');
  const [languagesStr, setLanguagesStr] = useState('English, Bengali, Hindi');
  const [qualificationsStr, setQualificationsStr] = useState('MBBS, MD');
  const [experienceYears, setExperienceYears] = useState('10');
  const [registrationReference, setRegistrationReference] = useState('');
  const [authorityName, setAuthorityName] = useState('West Bengal Medical Council');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [state, setState] = useState('West Bengal');
  const [feeRupees, setFeeRupees] = useState('800');
  const [publicPhone, setPublicPhone] = useState('+91 33 ');
  const [publicEmail, setPublicEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const specialties = specialtiesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const languages = languagesStr
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const qualifications = qualificationsStr
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean);

      const feeMinor = Math.round(parseFloat(feeRupees || '0') * 100);

      const payload = {
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantRole: applicantRole.trim(),
        displayName: displayName.trim(),
        providerType,
        specialties,
        languages,
        qualifications,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
        registrationReference: registrationReference.trim(),
        authorityName: authorityName.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: state.trim(),
        country: 'India',
        consultationFeeMinor: feeMinor,
        publicPhone: publicPhone.trim(),
        publicEmail: publicEmail.trim() || undefined,
      };

      const res = await fetch('/api/v1/providers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        if (res.status === 401) {
          throw new Error('Please sign in or register to submit a healthcare provider application.');
        }
        throw new Error(json.error?.message || 'Failed to submit application.');
      }

      setSubmittedId(json.data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Provider Application Submitted
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your application (ID: <span className="font-mono text-teal-800 font-semibold">{submittedId}</span>) has been queued for verification.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left text-xs text-slate-600 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Evidence-Based Review Standards
          </div>
          <p>
            DocNearby Trust Operations validates the submitted registration number against official statutory medical council registers (e.g., State Medical Council or National Medical Commission).
          </p>
          <p>
            Once verified, your profile will be published with transparent consultation pricing, language tags, and an official verified badge.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-xs"
          >
            Return to Healthcare Directory
          </Link>
          <Link
            href="/account"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Go to My Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          Healthcare Provider Directory Onboarding
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          List Your Practice on DocNearby
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Help travelers discover your clinic with transparent consultation fees, verified qualifications, and language compatibility.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs max-w-2xl mx-auto shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <span className="font-bold">Submission Notice</span>
            <p>{error}</p>
            {error.includes('sign in') && (
              <div className="pt-1">
                <Link href="/login" className="font-bold underline text-rose-900">
                  Click here to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        {/* Section 1: Applicant Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">1</span>
            Applicant Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Your Full Name</label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Dr. Debashis Sen"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Official Work Email</label>
              <input
                type="email"
                required
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="debashis.sen@example.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Your Role / Designation</label>
              <input
                type="text"
                required
                value={applicantRole}
                onChange={(e) => setApplicantRole(e.target.value)}
                placeholder="e.g. Consultant Physician / Admin"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Provider & Practice Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">2</span>
            Practice & Facility Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Listing Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dr. Debashis Sen Ortho Clinic"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Facility Type</label>
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              >
                <option value="doctor">Individual Doctor</option>
                <option value="clinic">Outpatient Clinic / Polyclinic</option>
                <option value="hospital">Hospital Facility</option>
                <option value="diagnostic_center">Diagnostic Center</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Specialties (comma-separated)</label>
              <input
                type="text"
                required
                value={specialtiesStr}
                onChange={(e) => setSpecialtiesStr(e.target.value)}
                placeholder="e.g. Orthopedics, Joint Replacement"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Spoken Languages (comma-separated)</label>
              <input
                type="text"
                required
                value={languagesStr}
                onChange={(e) => setLanguagesStr(e.target.value)}
                placeholder="e.g. English, Bengali, Hindi"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Qualifications (comma-separated)</label>
              <input
                type="text"
                required
                value={qualificationsStr}
                onChange={(e) => setQualificationsStr(e.target.value)}
                placeholder="e.g. MBBS, MS (Orthopedics)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Years of Clinical Experience</label>
              <input
                type="number"
                min="0"
                max="70"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Statutory Verification Credentials */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">3</span>
            Regulatory Registration & Verification Evidence
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Medical Registration / License Number</label>
              <input
                type="text"
                required
                value={registrationReference}
                onChange={(e) => setRegistrationReference(e.target.value)}
                placeholder="e.g. WBMC-REG-2010-4829"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Statutory Authority / Medical Council Name</label>
              <input
                type="text"
                required
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
                placeholder="e.g. West Bengal Medical Council / NMC"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <p>
              Your registration number and verification documents are reviewed strictly by authorized Trust Operations personnel against official statutory records. Private credentials are never leaked in public search responses.
            </p>
          </div>
        </div>

        {/* Section 4: Location, Fee & Contact */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">4</span>
            Location, Consultation Fee & Public Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Locality / Neighborhood</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Salt Lake Sector 1"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kolkata"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Standard Consultation Fee (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100000"
                  value={feeRupees}
                  onChange={(e) => setFeeRupees(e.target.value)}
                  placeholder="800"
                  className="w-full text-xs pl-7 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white font-semibold"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-slate-500 font-bold">₹</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Public Contact Phone</label>
              <input
                type="tel"
                required
                value={publicPhone}
                onChange={(e) => setPublicPhone(e.target.value)}
                placeholder="+91 33 2345 6789"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Public Inquiry Email (Optional)</label>
              <input
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                placeholder="clinic@example.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            By submitting, you certify that the provided credentials are true and accurate.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                Submit Listing Application
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
