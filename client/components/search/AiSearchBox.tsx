'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { ValidatedAiSearchIntent } from '@/server/validation/search';
import { formatPaiseToRupees } from '@/shared/utils/formatters';

interface AiSearchBoxProps {
  onFiltersExtracted: (intent: ValidatedAiSearchIntent) => void;
  onClearAi: () => void;
}

const EXAMPLE_QUERIES = [
  'Find an English-speaking dermatologist in Kolkata with a consultation fee below ₹1,000',
  'Pediatrician in Kolkata who speaks Bengali and English',
  'Cardiology consultation in Kolkata under ₹1,500',
  'Dental clinic in New Delhi speaking Hindi and English under ₹800',
];

export function AiSearchBox({ onFiltersExtracted, onClearAi }: AiSearchBoxProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedIntent, setExtractedIntent] = useState<ValidatedAiSearchIntent | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setWarningMessage(null);

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
      if (result.warning) {
        setWarningMessage(result.warning);
      }
      onFiltersExtracted(result.intent);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI interpretation failed. Please use manual filters below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (query: string) => {
    setPrompt(query);
  };

  const handleClear = () => {
    setPrompt('');
    setExtractedIntent(null);
    setError(null);
    setWarningMessage(null);
    onClearAi();
  };

  return (
    <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border border-teal-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Natural Language Healthcare Search
              <span className="text-[11px] font-normal text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                Optional Assistant
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Describe what you need in plain English. Converts to validated search filters only.
            </p>
          </div>
        </div>

        {extractedIntent && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear AI Filter
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Find an English-speaking dermatologist in Kolkata under ₹1,000"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white shadow-xs"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Interpreting...</span>
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

      {!extractedIntent && (
        <div className="mt-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
            Try asking:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUERIES.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(example)}
                className="text-xs text-slate-600 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 px-2.5 py-1 rounded-lg transition-colors text-left"
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {extractedIntent && (
        <div className="mt-4 pt-3 border-t border-teal-100">
          <span className="text-xs font-medium text-slate-700 block mb-2">
            Interpreted Search Filters (Passed to Trusted Provider Search):
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

      {warningMessage && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>{warningMessage}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

