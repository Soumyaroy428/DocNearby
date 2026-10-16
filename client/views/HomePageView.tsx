'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, AlertCircle, RefreshCw, Shield, LayoutGrid, Map as MapIcon, Compass, Navigation } from 'lucide-react';
import { Provider, SearchFilters, PaginatedResult } from '@/shared/types/provider';
import { ValidatedAiSearchIntent } from '@/server/validation/search';
import { AiSearchBox } from '@/client/components/search/AiSearchBox';
import { FilterBar } from '@/client/components/search/FilterBar';
import { ProviderCard } from '@/client/components/providers/ProviderCard';
import { ProviderMapView } from '@/client/components/maps/ProviderMapView';
import { ProviderComparisonDrawer } from '@/client/components/pricing/ProviderComparisonDrawer';
import { useLanguage } from '@/client/context/LanguageContext';

export function HomePageView() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    specialty: '',
    language: '',
    maxFeeMinor: undefined,
    providerType: undefined,
    latitude: undefined,
    longitude: undefined,
    radiusKm: undefined,
    sortBy: undefined,
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
  const [compareList, setCompareList] = useState<Provider[]>([]);

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
      if (typeof currentFilters.latitude === 'number' && typeof currentFilters.longitude === 'number') {
        params.set('latitude', String(currentFilters.latitude));
        params.set('longitude', String(currentFilters.longitude));
      }
      if (typeof currentFilters.radiusKm === 'number') {
        params.set('radiusKm', String(currentFilters.radiusKm));
      }
      if (currentFilters.sortBy) {
        params.set('sortBy', currentFilters.sortBy);
      }
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
      latitude: undefined,
      longitude: undefined,
      radiusKm: undefined,
      sortBy: undefined,
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

  const handleToggleCompare = (provider: Provider) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === provider.id);
      if (exists) {
        return prev.filter((p) => p.id !== provider.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 healthcare providers at once.');
        return prev;
      }
      return [...prev, provider];
    });
  };

  const handleRemoveCompare = (providerId: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== providerId));
  };

  const handleClearCompare = () => {
    setCompareList([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          {t.hero.badge}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t.hero.titlePart1} <span className="text-teal-600">{t.hero.titlePart2}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {t.hero.subtitle}
        </p>
      </div>

      {/* Google Maps Discovery Feature Banner */}
      <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50 border border-teal-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {t.mapsBanner.title}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {t.mapsBanner.newBadge}
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {t.mapsBanner.subtitle}
            </p>
          </div>
        </div>
        <Link
          href="/discovery"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex-shrink-0 text-center"
        >
          <Navigation className="w-3.5 h-3.5" />
          {t.mapsBanner.button}
        </Link>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {t.discovery.providersTitle}
            </h2>
            {result && !isLoading && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {result.meta.total} {t.discovery.resultsLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Cards vs Map */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {t.discovery.cardsView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-teal-600" />
                {t.discovery.mapView}
              </button>
            </div>

            <button
              onClick={() => loadProviders(filters)}
              disabled={isLoading}
              className="text-xs text-slate-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-50"
              title="Refresh results"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {t.discovery.refresh}
            </button>
          </div>
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
              {t.discovery.retry}
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
              <h3 className="text-base font-bold text-slate-900">{t.discovery.noResultsTitle}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t.discovery.noResultsDesc}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                {t.discovery.resetFilters}
              </button>
            </div>
          </div>
        )}

        {/* Provider Cards Grid or Map View */}
        {!isLoading && !error && result && result.data.length > 0 && (
          viewMode === 'map' ? (
            <ProviderMapView
              providers={result.data}
              userCoordinates={
                typeof filters.latitude === 'number' && typeof filters.longitude === 'number'
                  ? { latitude: filters.latitude, longitude: filters.longitude }
                  : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.data.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isComparing={compareList.some((p) => p.id === provider.id)}
                  onToggleCompare={handleToggleCompare}
                />
              ))}
            </div>
          )
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

      {/* Floating Side-by-Side Comparison Drawer */}
      <ProviderComparisonDrawer
        selectedProviders={compareList}
        onRemove={handleRemoveCompare}
        onClear={handleClearCompare}
      />
    </div>
  );
}

