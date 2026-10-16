import React from 'react';
import Link from 'next/link';
import { Shield, Info, HeartPulse, PhoneCall } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Healthcare Safety Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">
                Healthcare Safety & Informational Notice
              </p>
              <p>
                DocNearby is an independent discovery and navigation platform designed to help travelers locate local medical facilities, consult fee benchmarks, and review regulatory registration status.
              </p>
              <p>
                <strong>DocNearby does NOT provide medical diagnosis, treatment advice, or prescriptions.</strong> Regulatory verification confirms credential existence on official registers; it does not certify clinical superiority or guarantee medical outcomes. Consultation fees reflect recorded rates and do not guarantee total cost of treatment.
              </p>
              <p className="text-rose-700 font-medium flex items-center gap-1.5 pt-1">
                <PhoneCall className="w-3.5 h-3.5" />
                Medical Emergency in India? Dial <strong>112</strong> or <strong>102</strong> immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Legal Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2 pb-6 border-b border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">Discovery</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/" className="hover:text-teal-700 transition-colors">
                  Search Providers
                </Link>
              </li>
              <li>
                <Link href="/discovery" className="hover:text-teal-700 transition-colors">
                  Map Discovery
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">For Providers</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/register" className="hover:text-teal-700 transition-colors">
                  Join Directory
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-700 transition-colors">
                  Provider Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">Compliance & Trust</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-teal-700 transition-colors">
                  Privacy Policy (DPDP)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-700 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">Support</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/contact" className="hover:text-teal-700 transition-colors">
                  Grievance Redressal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-700 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>&copy; {new Date().getFullYear()} DocNearby. Trusted Care, Wherever You Are.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Evidence-based verification
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              Pilot: Kolkata, India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
