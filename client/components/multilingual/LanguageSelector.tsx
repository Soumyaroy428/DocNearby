'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/shared/types/multilingual';
import { useLanguage } from '@/client/context/LanguageContext';
import { TravelerPhrasebookModal } from './TravelerPhrasebookModal';

interface LanguageSelectorProps {
  fullWidth?: boolean;
}

export function LanguageSelector({ fullWidth = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState<boolean>(false);

  if (fullWidth) {
    return (
      <>
        <div className="space-y-2 w-full">
          {/* Full width language segment selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors text-center ${
                  language === lang.code
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Switch to ${lang.label}`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsPhrasebookOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>{t.nav.phrasebook}</span>
          </button>
        </div>

        <TravelerPhrasebookModal
          isOpen={isPhrasebookOpen}
          onClose={() => setIsPhrasebookOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsPhrasebookOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
          title="Open Medical Travel Phrasebook (English, Hindi, Bengali)"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">{t.nav.phrasebook}</span>
        </button>

        <div className="relative inline-block text-left">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  language === lang.code
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Switch to ${lang.label}`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TravelerPhrasebookModal
        isOpen={isPhrasebookOpen}
        onClose={() => setIsPhrasebookOpen(false)}
      />
    </>
  );
}
