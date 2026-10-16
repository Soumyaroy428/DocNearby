'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { Provider, SearchFilters, PaginatedResult } from '@/shared/types/provider';
import { ValidatedAiSearchIntent } from '@/server/validation/search';
import { AiSearchBox } from '@/client/components/search/AiSearchBox';
import { FilterBar } from '@/client/components/search/FilterBar';
import { ProviderCard } from '@/client/components/providers/ProviderCard';

export function HomePageView() {
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    specialty: '',
    language: '',
    maxFeeMinor: undefined,
    providerType: undefined,
    page: 1,
    limit: 10,
  });

  const [metadata, setMetadata] = useState<{
    cities: string[];
    specialties: string[];
    languages: string[];
  }>({
    cities: [],
    specialties: [],
    languages: [],
  });

  const [result, setResult] = useState<PaginatedResult<Provider> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch search metadata (dropdown options) on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/v1/metadata');
        const json = await res.json();
        if (json.data) {
          setMetadata(json.data);
        }
      } catch {
        // Non-blocking fallback
      }
    }
    loadMetadata();
  }, []);

  // Fetch providers matching current filters
  const loadProviders = useCallback(async (currentFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (currentFilters.city) params.set('city', currentFilters.city);
      if (currentFilters.specialty) params.set('specialty', currentFilters.specialty);
      if (currentFilters.language) params.set('language', currentFilters.language);
      if (typeof currentFilters.maxFeeMinor === 'number') {
        params.set('maxFeeMinor', String(currentFilters.maxFeeMinor));
      }
      if (currentFilters.providerType) params.set('providerType', currentFilters.providerType);
      if (currentFilters.page) params.set('page', String(currentFilters.page));
      if (currentFilters.limit) params.set('limit', String(currentFilters.limit));

      const res = await fetch(`/api/v1/providers?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to fetch healthcare providers');
      }

      setResult({
        data: json.data,
        meta: json.meta,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading providers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders(filters);
  }, [filters, loadProviders]);

  const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      city: '',
      specialty: '',
      language: '',
      maxFeeMinor: undefined,
      providerType: undefined,
      page: 1,
      limit: 10,
    });
  };

  const handleAiFiltersExtracted = (intent: ValidatedAiSearchIntent) => {
    setFilters((prev) => ({
      ...prev,
      city: intent.location || '',
      specialty: intent.specialty || '',
      language: intent.languages && intent.languages.length > 0 ? intent.languages[0] : '',
      maxFeeMinor: typeof intent.maxFeeMinor === 'number' ? intent.maxFeeMinor : undefined,
      providerType: intent.providerType || undefined,
      page: 1,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          Evidence-Based Healthcare Discovery for Travelers
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Trusted Healthcare, <span className="text-teal-600">Wherever You Are</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Search local doctors, clinics, and diagnostic facilities with transparent consultation pricing, language compatibility, and verified regulatory registrations in unfamiliar cities.
        </p>
      </div>

      {/* AI Assistant Search Box */}
      <section aria-label="AI Search Assistant">
        <AiSearchBox
          onFiltersExtracted={handleAiFiltersExtracted}
          onClearAi={handleResetFilters}
        />
      </section>

      {/* Manual Search and Filtering Bar */}
      <section aria-label="Manual Search Filters">
        <FilterBar
          filters={filters}
          metadata={metadata}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </section>

      {/* Results Header and Provider Cards */}
      <section aria-label="Search Results" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Healthcare Providers
            </h2>
            {result && !isLoading && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {result.meta.total} {result.meta.total === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>

          <button
            onClick={() => loadProviders(filters)}
            disabled={isLoading}
            className="text-xs text-slate-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-50"
            title="Refresh results"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load providers</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => loadProviders(filters)}
              className="text-xs font-semibold px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Retry Search
            </button>
          </div>
        )}

        {/* Empty / No Results State */}
        {!isLoading && !error && result && result.data.length === 0 && (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No healthcare providers found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No matching verified or demonstration providers were found with your current filter criteria.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Clear all filters and show all providers
              </button>
            </div>
          </div>
        )}

        {/* Provider Cards Grid */}
        {!isLoading && !error && result && result.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {result.data.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>

      {/* Verification Standards Education Section */}
      <section id="verification-policy" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Our Evidence-Based Verification Standards
            </h3>
            <p className="text-xs text-slate-500">
              Transparency, accountability, and patient safety
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Registry Validation</span>
            <p className="text-slate-600 leading-relaxed">
              We check medical council registration numbers directly against official state and national statutory registers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">2. Price Transparency</span>
            <p className="text-slate-600 leading-relaxed">
              Consultation fees are displayed with their verification source (tariff card, receptionist check, or patient report) and date.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Language & Accessibility</span>
            <p className="text-slate-600 leading-relaxed">
              We catalog spoken languages and verified accessibility features (ramps, elevators) so travelers find care tailored to their needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

