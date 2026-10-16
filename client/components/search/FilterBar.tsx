'use client';

import React from 'react';
import { Search, MapPin, Stethoscope, Languages, IndianRupee, RotateCcw } from 'lucide-react';
import { SearchFilters, ProviderType } from '@/shared/types/provider';

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
  const hasActiveFilters = Boolean(
    filters.city ||
    filters.specialty ||
    filters.language ||
    filters.maxFeeMinor ||
    filters.providerType ||
    filters.query
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" />
          Filter Healthcare Providers
        </h3>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* City Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            City or Locality
          </label>
          <div className="relative">
            <input
              type="text"
              list="city-suggestions"
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value)}
              placeholder="e.g. Kolkata, Salt Lake"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
            />
            <datalist id="city-suggestions">
              {metadata.cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Specialty Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            Specialty
          </label>
          <select
            value={filters.specialty || ''}
            onChange={(e) => onFilterChange('specialty', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">All Specialties</option>
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
            Language Spoken
          </label>
          <select
            value={filters.language || ''}
            onChange={(e) => onFilterChange('language', e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">Any Language</option>
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
            Max Consultation Fee
          </label>
          <select
            value={filters.maxFeeMinor ? String(filters.maxFeeMinor) : ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onFilterChange('maxFeeMinor', val);
            }}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="">Any Fee</option>
            <option value="50000">Under ₹500</option>
            <option value="80000">Under ₹800</option>
            <option value="100000">Under ₹1,000</option>
            <option value="150000">Under ₹1,500</option>
            <option value="200000">Under ₹2,000</option>
          </select>
        </div>
      </div>

      {/* Provider Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 mr-1">Facility Type:</span>
        {(
          [
            { label: 'All Types', value: undefined },
            { label: 'Doctors', value: 'doctor' },
            { label: 'Clinics', value: 'clinic' },
            { label: 'Diagnostics', value: 'diagnostic_center' },
          ] as { label: string; value: ProviderType | undefined }[]
        ).map((item) => {
          const isActive = filters.providerType === item.value;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onFilterChange('providerType', item.value)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
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
    </div>
  );
}

