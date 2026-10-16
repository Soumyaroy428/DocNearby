'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HeartPulse,
  AlertCircle,
  Search,
  User,
  Stethoscope,
  ShieldAlert,
  Scale,
  Calendar,
  Compass,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { UserPublicProfile } from '@/shared/types/auth';
import { LanguageSelector } from '@/client/components/multilingual/LanguageSelector';
import { TravelerPhrasebookModal } from '@/client/components/multilingual/TravelerPhrasebookModal';
import { useLanguage } from '@/client/context/LanguageContext';

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState(false);

  // Automatically close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 w-full max-w-full">
        {/* Emergency Quick Notice Banner */}
        <div className="bg-rose-50 border-b border-rose-100 px-3 sm:px-4 py-1.5 text-xs text-rose-900 w-full">
          <div className="flex items-start sm:items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-tight sm:leading-normal text-[11px] sm:text-xs">
              {t.nav.emergencyWarning}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Tagline */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition-colors">
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1">
                  DocNearby
                  <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                    Demo
                  </span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                  Trusted Care, Wherever You Are
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links (Large Screens >= 1024px) */}
            <nav className="hidden lg:flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/'
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>{t.nav.findCare}</span>
              </Link>

              <Link
                href="/discovery"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                  pathname === '/discovery'
                    ? 'text-teal-700 bg-teal-50'
                    : 'text-teal-700 hover:bg-teal-50/70'
                }`}
                title="Interactive Google Maps & Places Discovery"
              >
                <Compass className="w-4 h-4 text-teal-600" />
                <span>{t.nav.mapDiscovery}</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                  {t.nav.newBadge}
                </span>
              </Link>

              <Link
                href="/providers/apply"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs ${
                  pathname === '/providers/apply'
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.nav.listPractice}</span>
              </Link>

              {user?.role === 'admin' && (
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                  <Link
                    href="/admin/verification"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
                    title="Provider Verifications"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.nav.verifications}</span>
                  </Link>
                  <Link
                    href="/admin/price-reports"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors"
                    title="Price Reports & Staleness Audits"
                  >
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t.nav.priceReports}</span>
                  </Link>
                </div>
              )}

              {/* Language Selector & Medical Phrasebook */}
              <div className="pl-1 border-l border-slate-200">
                <LanguageSelector />
              </div>

              {/* Authentication actions */}
              <div className="pl-1 border-l border-slate-200">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/appointments"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:text-teal-700 hover:bg-slate-200/70 font-semibold text-xs transition-colors border border-slate-200"
                      title="My Appointments"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.nav.appointments}</span>
                    </Link>
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
                      {t.nav.signIn}
                    </Link>
                    <Link
                      href="/register"
                      className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
                    >
                      {t.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile & Tablet Hamburger & Quick Action Bar (Hidden on lg+) */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPhrasebookOpen(true)}
                className="p-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors"
                title="Medical Travel Phrasebook"
                aria-label="Open Medical Phrasebook"
              >
                <BookOpen className="w-4 h-4 text-teal-700" />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-900" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-900" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer (Animated & Full-Width) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl">
            <div className="px-4 py-4 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* Primary Discovery Navigation */}
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Search className="w-4 h-4 text-teal-600" />
                  <span>{t.nav.findCare}</span>
                </Link>

                <Link
                  href="/discovery"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/discovery'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-teal-600" />
                    <span>{t.nav.mapDiscovery}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Google Maps
                  </span>
                </Link>

                <Link
                  href="/providers/apply"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/providers/apply'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>{t.nav.listPractice}</span>
                </Link>
              </div>

              {/* Admin Links if Admin */}
              {user?.role === 'admin' && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                    Administration
                  </p>
                  <Link
                    href="/admin/verification"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>{t.nav.verifications}</span>
                  </Link>
                  <Link
                    href="/admin/price-reports"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200"
                  >
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>{t.nav.priceReports}</span>
                  </Link>
                </div>
              )}

              {/* Multilingual & Phrasebook Controls */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Traveler Language &amp; Support
                </p>
                <LanguageSelector fullWidth />
              </div>

              {/* User Account / Sign In */}
              <div className="pt-3 border-t border-slate-100">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/appointments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                      >
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{t.nav.appointments}</span>
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-2.5 px-3 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-teal-200"
                      >
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>{t.nav.myAccount}</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                    >
                      {t.nav.signIn}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs"
                    >
                      {t.nav.register}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global phrasebook modal triggerable from mobile header quick button */}
      <TravelerPhrasebookModal
        isOpen={isPhrasebookOpen}
        onClose={() => setIsPhrasebookOpen(false)}
      />
    </>
  );
}
