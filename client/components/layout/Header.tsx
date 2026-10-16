'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartPulse, AlertCircle, Search, ShieldCheck, User, Stethoscope, ShieldAlert, Scale } from 'lucide-react';
import { UserPublicProfile } from '@/shared/types/auth';

export function Header() {
  const [user, setUser] = useState<UserPublicProfile | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        if (json.data) {
          setUser(json.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

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
          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium text-slate-700">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:text-teal-700 hover:bg-slate-100 transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Find Care</span>
            </Link>

            <Link
              href="/providers/apply"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors text-xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>List Practice</span>
            </Link>

            {user?.role === 'admin' && (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/admin/verification"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
                  title="Provider Verifications"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Verifications</span>
                </Link>
                <Link
                  href="/admin/price-reports"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors"
                  title="Price Reports & Staleness Audits"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Price Reports</span>
                </Link>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-xs transition-colors border border-teal-200"
                >
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
