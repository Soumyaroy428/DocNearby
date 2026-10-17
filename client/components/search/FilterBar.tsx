'use client';

import React from 'react';
import {
  Search,
  MapPin,
  Stethoscope,
  Languages,
  IndianRupee,
  RotateCcw,
  Navigation,
  Loader2,
  X,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { SearchFilters, ProviderType, SearchSortBy } from '@/shared/types/provider';
import { useGeolocation } from '@/client/hooks/useGeolocation';
import { useLanguage } from '@/client/context/LanguageContext';

interface FilterBarProps {
  filters: SearchFilters;
  metadata: {
    cities: string[];
    specialties: string[];
    languages: string[];
  };
  onFilterChange: (key: keyof SearchFilters, value: unknown) => void;
  onReset: () => void;
}

export function FilterBar({
  filters,
  metadata,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  const { t } = useLanguage();
  const { state: geoState, errorMessage: geoError, requestLocation, clearLocation } = useGeolocation();

  const isGeoActive =
    typeof filters.latitude === 'number' && typeof filters.longitude === 'number';

  const hasActiveFilters = Boolean(
    filters.city ||
    filters.specialty ||
    filters.language ||
    filters.maxFeeMinor ||
    filters.providerType ||
    filters.query ||
    isGeoActive ||
    filters.sortBy
  );

  const handleUseMyLocation = async () => {
    const coords = await requestLocation();
    if (coords) {
      onFilterChange('latitude', coords.latitude);
      onFilterChange('longitude', coords.longitude);
      if (coords.city) {
        onFilterChange('city', coords.city);
      }
      onFilterChange('sortBy', 'distance');
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    onFilterChange('latitude', undefined);
    onFilterChange('longitude', undefined);
    if (filters.sortBy === 'distance') {
      onFilterChange('sortBy', 'relevance');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" />
          {t.filters.title}
        </h3>

        {hasActiveFilters && (
          <button
            onClick={() => {
              clearLocation();
              onReset();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.filters.resetAll}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* City / Location Filter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {t.filters.city}
            </label>
            <button
              type="button"
              onClick={isGeoActive ? handleClearLocation : handleUseMyLocation}
              disabled={geoState === 'locating'}
              className={`text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                isGeoActive
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
              }`}
              title="Use current device GPS location for nearby search"
            >
              {geoState === 'locating' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t.filters.locating}
                </>
              ) : isGeoActive ? (
                <>
                  <Navigation className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  {t.filters.gpsActive}
                  <X className="w-3 h-3 ml-0.5 hover:text-red-600" />
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3 text-teal-600" />
                  {t.filters.nearMe}
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              list="city-suggestions"
              value={filters.city || ''}
              onChange={(e) => {
                onFilterChange('city', e.target.value);
                if (isGeoActive) {
                  onFilterChange('latitude', undefined);
                  onFilterChange('longitude', undefined);
                }
              }}
              placeholder={isGeoActive ? (filters.city ? `Near ${filters.city}` : 'GPS location enabled') : t.filters.cityPlaceholder}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
            <datalist id="city-suggestions">
              {metadata.cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            {geoError && !isGeoActive && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{geoError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Specialty Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            {t.filters.specialty}
          </label>
          <select
            value={filters.specialty || ''}
            onChange={(e) => onFilterChange('specialty', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">{t.filters.allSpecialties}</option>
            {metadata.specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-teal-600" />
            {t.filters.language}
          </label>
          <select
            value={filters.language || ''}
            onChange={(e) => onFilterChange('language', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">{t.filters.anyLanguage}</option>
            {metadata.languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Fee Limit Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-teal-600" />
            {t.filters.maxFee}
          </label>
          <select
            value={filters.maxFeeMinor ? String(filters.maxFeeMinor) : ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onFilterChange('maxFeeMinor', val);
            }}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">{t.filters.anyFee}</option>
            <option value="50000">Under ₹500</option>
            <option value="80000">Under ₹800</option>
            <option value="100000">Under ₹1,000</option>
            <option value="150000">Under ₹1,500</option>
            <option value="200000">Under ₹2,000</option>
          </select>
        </div>
      </div>

      {/* Geolocation Polite Fallback / Notification Banner */}
      {geoError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <strong>Location Note:</strong> {geoError}
          </div>
        </div>
      )}

      {/* Secondary Controls: Radius & Sort By & Facility Types */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Facility Types Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500 mr-1">Facility:</span>
          {(
            [
              { label: t.filters.facilityAll, value: undefined },
              { label: t.filters.facilityDoctors, value: 'doctor' },
              { label: t.filters.facilityClinics, value: 'clinic' },
              { label: t.filters.facilityDiagnostics, value: 'diagnostic_center' },
            ] as { label: string; value: ProviderType | undefined }[]
          ).map((item) => {
            const isActive = filters.providerType === item.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onFilterChange('providerType', item.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Sorting & Proximity Radius Options */}
        <div className="flex items-center gap-3">
          {/* Radius selector when GPS location is active */}
          {isGeoActive && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">{t.filters.radius}:</span>
              <select
                value={filters.radiusKm || 10}
                onChange={(e) => onFilterChange('radiusKm', Number(e.target.value))}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
              </select>
            </div>
          )}

          {/* Sort By Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">{t.filters.sort}:</span>
            <select
              value={filters.sortBy || (isGeoActive ? 'distance' : 'relevance')}
              onChange={(e) => onFilterChange('sortBy', e.target.value as SearchSortBy)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="relevance">{t.filters.sortRelevance}</option>
              <option value="distance">{t.filters.sortDistance}</option>
              <option value="fee_asc">{t.filters.sortFeeAsc}</option>
              <option value="fee_desc">{t.filters.sortFeeDesc}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
