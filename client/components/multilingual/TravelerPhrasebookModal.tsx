'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Copy,
  Check,
  AlertCircle,
  PhoneCall,
  Search,
  Sparkles,
  Stethoscope,
  IndianRupee,
  Pill,
} from 'lucide-react';
import { TravelMedicalPhrase } from '@/shared/types/multilingual';

interface TravelerPhrasebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TravelerPhrasebookModal({ isOpen, onClose }: TravelerPhrasebookModalProps) {
  const [phrases, setPhrases] = useState<TravelMedicalPhrase[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPhrases() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/ai/phrasebook?category=${category}`);
        const json = await res.json();
        if (json.data?.phrases) {
          setPhrases(json.data.phrases);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadPhrases();
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleCopy = (phraseText: string, id: string) => {
    navigator.clipboard.writeText(phraseText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPhrases = phrases.filter((p) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      p.english.toLowerCase().includes(term) ||
      p.hindi.toLowerCase().includes(term) ||
      p.bengali.toLowerCase().includes(term) ||
      (p.hindiTransliteration && p.hindiTransliteration.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Traveler Healthcare Communication Phrasebook
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  EN • HI • BN
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Essential medical phrases translated across English, Hindi (हिन्दी), and Bengali (বাংলা)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency Notice Callout */}
        <div className="bg-rose-50 border-b border-rose-100 px-5 py-2.5 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Life-Threatening Emergency?</strong> Dial <strong>112</strong> / <strong>102</strong> immediately in India for ambulance services.
            </span>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            <PhoneCall className="w-3 h-3" /> Dial 112
          </a>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search phrases in English, Hindi, or Bengali..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Phrases', icon: Sparkles },
              { id: 'emergency', label: 'Emergency', icon: AlertCircle },
              { id: 'consultation', label: 'Consultation & Triage', icon: Stethoscope },
              { id: 'pricing', label: 'Fees & Insurance', icon: IndianRupee },
              { id: 'pharmacy', label: 'Pharmacy & Chemist', icon: Pill },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    category === tab.id
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phrases List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading phrasebook...</div>
          ) : filteredPhrases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching travel phrases found for &quot;{searchFilter}&quot;.
            </div>
          ) : (
            filteredPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* English */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                      English
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{phrase.english}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(phrase.english, `${phrase.id}-en`)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copy English text"
                  >
                    {copiedId === `${phrase.id}-en` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                  {/* Hindi */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        हिन्दी (Hindi)
                      </span>
                      <button
                        onClick={() => handleCopy(phrase.hindi, `${phrase.id}-hi`)}
                        className="text-[11px] text-slate-400 hover:text-slate-700"
                        title="Copy Hindi"
                      >
                        {copiedId === `${phrase.id}-hi` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{phrase.hindi}</p>
                    {phrase.hindiTransliteration && (
                      <p className="text-[11px] text-slate-500 italic">
                        &quot;{phrase.hindiTransliteration}&quot;
                      </p>
                    )}
                  </div>

                  {/* Bengali */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                        বাংলা (Bengali)
                      </span>
                      <button
                        onClick={() => handleCopy(phrase.bengali, `${phrase.id}-bn`)}
                        className="text-[11px] text-slate-400 hover:text-slate-700"
                        title="Copy Bengali"
                      >
                        {copiedId === `${phrase.id}-bn` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{phrase.bengali}</p>
                    {phrase.bengaliTransliteration && (
                      <p className="text-[11px] text-slate-500 italic">
                        &quot;{phrase.bengaliTransliteration}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Show this card to clinic reception or triage nurses when traveling.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

