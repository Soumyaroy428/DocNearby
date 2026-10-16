'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  ArrowRight,
  X,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react';
import { ValidatedAiSearchIntent } from '@/server/validation/search';
import { AiSafetyAssessment } from '@/shared/types/multilingual';
import { formatPaiseToRupees } from '@/shared/utils/formatters';

interface AiSearchBoxProps {
  onFiltersExtracted: (intent: ValidatedAiSearchIntent) => void;
  onClearAi: () => void;
}

const EXAMPLE_QUERIES = [
  'Find an English-speaking dermatologist in Kolkata with consultation below ₹1,000',
  'कोलकाता में चमड़ी के विशेषज्ञ डॉक्टर ₹1,000 के अंदर (Hindi)',
  'কলকাতায় শিশুর ডাক্তার ইংরেজি ও বাংলা বলেন (Bengali)',
  'Cardiology consultation in Kolkata under ₹1,500',
];

export function AiSearchBox({ onFiltersExtracted, onClearAi }: AiSearchBoxProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedIntent, setExtractedIntent] = useState<ValidatedAiSearchIntent | null>(null);
  const [safetyAssessment, setSafetyAssessment] = useState<AiSafetyAssessment | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setWarningMessage(null);
    setSafetyAssessment(null);

    try {
      const res = await fetch('/api/v1/ai/search-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to interpret search intent');
      }

      const result = json.data;
      setExtractedIntent(result.intent);

      if (result.safety) {
        setSafetyAssessment(result.safety);
      }

      if (result.warning) {
        setWarningMessage(result.warning);
      }

      onFiltersExtracted(result.intent);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'AI interpretation failed. Please use manual filters below.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (query: string) => {
    // Strip trailing language tag if present
    const cleanQuery = query.replace(/\s*\((?:Hindi|Bengali)\)$/i, '');
    setPrompt(cleanQuery);
  };

  const handleClear = () => {
    setPrompt('');
    setExtractedIntent(null);
    setSafetyAssessment(null);
    setError(null);
    setWarningMessage(null);
    onClearAi();
  };

  return (
    <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border border-teal-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              Natural Language Healthcare Assistant
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                Multilingual (EN • HI • BN)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Type naturally in English, हिन्दी, or বাংলা. Converts to validated search filters only.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg"
            title="Personal data (phones, emails, IDs) is scrubbed before processing"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Privacy Scrubbed
          </span>

          {extractedIntent && (
            <button
              onClick={handleClear}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Find an English-speaking dermatologist in Kolkata under ₹1,000 / কলকাতা বা দিল্লিতে ডাক্তার"
            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white shadow-xs"
            disabled={isLoading}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-semibold rounded-2xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Emergency Alert Banner */}
      {safetyAssessment?.isEmergency && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Acute Medical Emergency Warning:</strong>
              <p className="text-[11px] text-rose-800 mt-0.5">
                {safetyAssessment.emergencyGuidance}
              </p>
            </div>
          </div>
          <a
            href="tel:112"
            className="self-start sm:self-center inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex-shrink-0 shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call 112 (India)
          </a>
        </div>
      )}

      {/* Clinical Advice Blocked Disclaimer */}
      {safetyAssessment?.isClinicalAdviceBlocked && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Non-Clinical Scope Notice:</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {safetyAssessment.blockedAdviceExplanation}
              </p>
            </div>
          </div>
          {safetyAssessment.recommendedSpecialty && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-teal-800">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Recommended in-person specialty:{' '}
                <strong>{safetyAssessment.recommendedSpecialty}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Example Suggestions */}
      {!extractedIntent && (
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
            Try asking in any language:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(example)}
                className="text-xs text-slate-600 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 px-3 py-1 rounded-xl transition-colors text-left"
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Intent Filter Chips */}
      {extractedIntent && (
        <div className="pt-2 border-t border-teal-100 space-y-1.5">
          <span className="text-xs font-semibold text-slate-700 block">
            Validated Search Filters Extracted:
          </span>
          <div className="flex flex-wrap gap-2">
            {extractedIntent.location && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-medium">
                City: <strong>{extractedIntent.location}</strong>
              </span>
            )}
            {extractedIntent.specialty && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-medium">
                Specialty: <strong>{extractedIntent.specialty}</strong>
              </span>
            )}
            {extractedIntent.languages && extractedIntent.languages.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-medium">
                Languages: <strong>{extractedIntent.languages.join(', ')}</strong>
              </span>
            )}
            {typeof extractedIntent.maxFeeMinor === 'number' && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-medium">
                Max Fee: <strong>{formatPaiseToRupees(extractedIntent.maxFeeMinor)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Warning Message */}
      {warningMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
