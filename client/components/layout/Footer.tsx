import React from 'react';
import { Shield, Info, HeartPulse } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
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
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>&copy; {new Date().getFullYear()} DocNearby. All demonstration data clearly labelled.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Evidence-based verification
            </span>
            <span>Pilot: Kolkata, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
