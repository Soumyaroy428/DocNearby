'use client';

import React from 'react';
import Link from 'next/link';
import { HeartPulse, AlertCircle, Search, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Emergency Quick Notice Banner */}
      <div className="bg-rose-50 border-b border-rose-100 px-4 py-1.5 text-xs text-rose-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5 max-w-5xl mx-auto w-full">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
          <span>
            <strong>Medical Emergency?</strong> If you require urgent medical care, immediately dial local emergency services: <strong>112</strong> / <strong>102</strong> (India). DocNearby is for discovery only.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition-colors">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                DocNearby
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">Demo</span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">Trusted Care, Wherever You Are</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:text-teal-700 hover:bg-slate-100 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Find Care</span>
            </Link>

            <Link
              href="/#verification-policy"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:text-teal-700 hover:bg-slate-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Verification Standards</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

