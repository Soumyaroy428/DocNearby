'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Info, HeartPulse, PhoneCall } from 'lucide-react';
import { useLanguage } from '@/client/context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white mt-16 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Healthcare Safety Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">
                {t.footer.safetyTitle}
              </p>
              <p>
                {t.footer.safetyP1}
              </p>
              <p>
                {t.footer.safetyP2}
              </p>
              <p className="text-rose-700 font-medium flex items-center gap-1.5 pt-1">
                <PhoneCall className="w-3.5 h-3.5" />
                {t.footer.emergencyNotice}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Legal Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2 pb-6 border-b border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">{t.footer.discoveryHeader}</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/" className="hover:text-teal-700 transition-colors">
                  {t.footer.searchProviders}
                </Link>
              </li>
              <li>
                <Link href="/discovery" className="hover:text-teal-700 transition-colors">
                  {t.footer.mapDiscovery}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">{t.footer.providersHeader}</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/register" className="hover:text-teal-700 transition-colors">
                  {t.footer.joinDirectory}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-700 transition-colors">
                  {t.footer.providerPortal}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">{t.footer.complianceHeader}</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-teal-700 transition-colors">
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-teal-700 transition-colors">
                  {t.footer.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2.5">{t.footer.supportHeader}</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <Link href="/contact" className="hover:text-teal-700 transition-colors">
                  {t.footer.grievanceRedressal}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-700 transition-colors">
                  {t.footer.contactSupport}
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
              {t.footer.evidenceVerified}
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {t.footer.pilotBadge}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
