'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, AlertTriangle, ShieldCheck, MapPin, DollarSign, CalendarCheck, ArrowLeft } from 'lucide-react';

export function TermsPageView() {
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
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            <p className="text-sm text-slate-500">
              DocNearby — Trusted Care, Wherever You Are. Last updated: October 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Statutory Medical Disclaimer Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-3 text-amber-950 shadow-xs">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>STATUTORY NON-CLINICAL & EMERGENCY DISCLAIMER</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed">
          <strong>DocNearby is NOT a healthcare provider, hospital, or emergency dispatch service.</strong> DocNearby operates strictly as an independent information and discovery platform. We do not provide clinical medical diagnosis, triage, disease management, or drug prescriptions.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed">
          No communication through DocNearby constitutes or establishes a doctor-patient relationship. In any acute medical emergency, chest pain, stroke symptoms, major trauma, or pediatric crisis, immediately call <strong>112</strong> or <strong>102</strong> in India or go to the nearest emergency department.
        </p>
      </div>

      <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3>1. Healthcare Discovery & Credential Verification</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            DocNearby distinguishes between two distinct discovery sources:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 text-xs">
            <li>
              <strong>DocNearby Registered Providers:</strong> Healthcare practitioners and medical facilities who registered on DocNearby and completed credential review against official medical registers (e.g., National Medical Commission or State Medical Councils). Verification confirms credential existence on public rolls; it does NOT constitute an endorsement of clinical quality, outcome guarantees, or therapeutic efficacy.
            </li>
            <li>
              <strong>Google Places Discovery Listings:</strong> Public healthcare facilities, diagnostic centers, and clinics aggregated via Google Maps Platform. These listings are labelled <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">&quot;Google-listed&quot;</span> and are explicitly marked <span className="text-amber-700 font-semibold">&quot;Not verified by DocNearby&quot;</span>. DocNearby does not verify their medical credentials or consultation fees.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <DollarSign className="w-5 h-5 text-teal-600" />
            <h3>2. Transparent Fee Benchmarks & Price Limitations</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Consultation fees displayed on DocNearby reflect standard outpatient fees verified directly with participating providers or collected via administrative review.
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            These figures represent initial outpatient consultation charges only and do not include laboratory tests, radiographic imaging, surgical interventions, prescription pharmaceuticals, or inpatient hospital accommodation. Prices are subject to periodic re-verification and clinic policies.
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <CalendarCheck className="w-5 h-5 text-teal-600" />
            <h3>3. Appointment Scheduling Terms</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            DocNearby provides an appointment request routing interface for participating providers. Submitting an appointment request notifies the provider; appointments are confirmed only when the provider reviews and accepts the slot. DocNearby is not responsible for provider scheduling delays, unforeseen medical emergencies, or appointment cancellations.
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h3>4. Pilot Geography & Governing Law</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            DocNearby is currently operating its initial single-city pilot in <strong>Kolkata, West Bengal, India</strong> (focusing on Park Street, Salt Lake Sector V, New Town, and Ballygunge facilities).
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            These terms are governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Kolkata, West Bengal, India.
          </p>
        </section>
      </div>
    </div>
  );
}
