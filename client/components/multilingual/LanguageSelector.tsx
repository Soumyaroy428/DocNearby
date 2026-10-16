'use client';

import React, { useState } from 'react';
import { Languages, BookOpen } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/shared/types/multilingual';
import { TravelerPhrasebookModal } from './TravelerPhrasebookModal';

export function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState<boolean>(false);

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
          <span className="hidden sm:inline">Phrasebook</span>
        </button>

        <div className="relative inline-block text-left">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  selectedLang === lang.code
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
