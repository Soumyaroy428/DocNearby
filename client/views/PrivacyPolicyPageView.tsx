'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, EyeOff, UserCheck, FileText, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';

export function PrivacyPolicyPageView() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-700">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-slate-500">
              DocNearby — Trusted Care, Wherever You Are. Last updated: October 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Core Privacy Promise Banner */}
      <div className="bg-teal-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 text-teal-300 font-semibold text-sm">
          <Lock className="w-4 h-4" />
          <span>Our Healthcare Privacy Promise</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold leading-snug">
          We never monetize or sell your health search history. Your medical discovery is strictly confidential.
        </h2>
        <p className="text-sm text-teal-100 leading-relaxed max-w-2xl">
          DocNearby is engineered specifically for domestic and international travelers seeking reliable care. We implement strict data minimization, client-side session tokens, and automated PII scrubbing to protect your personal privacy.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <EyeOff className="w-5 h-5 text-teal-600" />
            <h3>1. Data Minimization & PII Scrubbing</h3>
          </div>
          <p>
            DocNearby collects only the minimum necessary information required to deliver healthcare discovery, transparent fee estimation, and provider appointments.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
            <li>
              <strong>Automated PII Scrubbing:</strong> Any unstructured symptom queries submitted to our AI search or travel phrasebook are automatically stripped of Aadhaar numbers, PAN cards, phone numbers, and email addresses prior to evaluation.
            </li>
            <li>
              <strong>No Precise GPS Retention:</strong> When you grant browser location permission to find &quot;Nearby Facilities&quot;, your exact GPS coordinates are used solely to query the local radius in-memory and are never stored on persistent disk or tracked across user sessions.
            </li>
            <li>
              <strong>No Advertising Trackers:</strong> We do not deploy third-party advertising cookies, behavioral tracking pixels, or data broker beacons.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <h3>2. Information We Process</h3>
          </div>
          <div className="space-y-2 text-xs">
            <p>
              <strong>Account Information:</strong> When registering as a traveler or provider, we collect your email address and store a salted, cryptographically hashed representation of your password using the Node.js <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">scrypt</code> algorithm. Plaintext passwords are never logged or stored.
            </p>
            <p>
              <strong>Appointment Bookings:</strong> When requesting a consultation with a verified DocNearby provider, your contact name and telephone number are shared strictly with that specific clinic or practitioner to facilitate confirmation and clinical check-in.
            </p>
            <p>
              <strong>Patient Reviews:</strong> Reviews submitted for clinics and doctors are published under your display name. Verified patient badges are granted automatically when a completed consultation record exists in our system.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3>3. Indian DPDP Act 2023 & GDPR Compliance</h3>
          </div>
          <p>
            In alignment with India&apos;s <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em> and global privacy principles (including the EU General Data Protection Regulation):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
            <li><strong>Right to Access:</strong> You can view all saved healthcare providers and profile details anytime via your Account Dashboard.</li>
            <li><strong>Right to Correction:</strong> You can update your language preferences, contact information, and name at any time.</li>
            <li><strong>Right to Erasure (Account Deletion):</strong> You may request complete erasure of your user profile, saved bookmarks, and historical appointment records.</li>
            <li><strong>No Dark Patterns:</strong> We provide transparent consent mechanisms and do not deploy manipulative interface tricks.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Mail className="w-5 h-5 text-teal-600" />
            <h3>4. Grievance Redressal & Data Protection Officer</h3>
          </div>
          <p className="text-xs">
            Under the provisions of the Information Technology Act and DPDP Act 2023, DocNearby maintains an active Grievance Redressal Officer to handle privacy questions, data requests, or complaints:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1 text-slate-800">
            <p><strong>Designation:</strong> Data Protection & Grievance Redressal Officer</p>
            <p><strong>Official Email:</strong> <a href="mailto:privacy@docnearby.com" className="text-teal-700 underline font-semibold">privacy@docnearby.com</a></p>
            <p><strong>Support Desk:</strong> <a href="mailto:support@docnearby.com" className="text-teal-700 underline font-semibold">support@docnearby.com</a></p>
            <p><strong>Acknowledgment Time:</strong> Within 48 hours of receipt</p>
            <p><strong>Resolution SLA:</strong> Within 30 calendar days</p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-amber-900">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Emergency Healthcare Disclaimer</span>
          </div>
          <p className="text-xs leading-relaxed">
            DocNearby is a technological discovery directory, not a clinical emergency provider. If you are experiencing an acute medical emergency, chest pain, severe trauma, or life-threatening symptoms, dial <strong>112</strong> or <strong>102</strong> in India immediately or proceed to the nearest emergency room.
          </p>
        </section>
      </div>
    </div>
  );
}
