'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  X,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Compass,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { UnifiedHealthcareListing, UnifiedSearchResponse } from '@/shared/types/discovery';
import { UnifiedResultCard } from '@/client/components/discovery/UnifiedResultCard';
import { GoogleDiscoveryMap } from '@/client/components/maps/GoogleDiscoveryMap';
import { GooglePlaceProfileModal } from '@/client/components/discovery/GooglePlaceProfileModal';
import { useGeolocation, GeolocationCoordinates } from '@/client/hooks/useGeolocation';
import { BookAppointmentModal } from '@/client/components/appointments/BookAppointmentModal';
import { Provider } from '@/shared/types/provider';
import { useLanguage } from '@/client/context/LanguageContext';

export function DiscoveryPageView() {
  const { t } = useLanguage();
  const { state: geoState, errorMessage: geoError, requestLocation, clearLocation } = useGeolocation();

  // Search parameters
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'docnearby' | 'google_places'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'relevance' | 'rating'>('distance');
  const [userCoords, setUserCoords] = useState<GeolocationCoordinates | null>(null);

  // Layout View mode
  const [viewMode, setViewMode] = useState<'split' | 'cards' | 'map'>('split');

  // Results State
  const [results, setResults] = useState<UnifiedHealthcareListing[]>([]);
  const [meta, setMeta] = useState<UnifiedSearchResponse['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [activeProfileListing, setActiveProfileListing] = useState<UnifiedHealthcareListing | null>(null);

  // Booking Modal State (CC-06 preservation)
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(null);

  // Search execution
  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (city.trim()) params.set('city', city.trim());
      if (specialty.trim()) params.set('specialty', specialty.trim());
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('radiusKm', String(radiusKm));

      if (userCoords) {
        params.set('latitude', String(userCoords.latitude));
        params.set('longitude', String(userCoords.longitude));
      }

      const res = await fetch(`/api/v1/search/places?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to search healthcare listings');
      }

      setResults(json.data || []);
      setMeta(json.meta || null);

      if (json.data && json.data.length > 0) {
        setSelectedListingId(json.data[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during search.');
    } finally {
      setIsLoading(false);
    }
  }, [query, city, specialty, radiusKm, sourceFilter, sortBy, userCoords]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleUseMyLocation = async () => {
    const coords = await requestLocation();
    if (coords) {
      setUserCoords(coords);
      // Clear manual city text so GPS radius search finds all healthcare facilities within radius
      setCity('');
      setSortBy('distance');
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    setUserCoords(null);
    setSortBy('relevance');
  };

  const handleResetFilters = () => {
    setQuery('');
    setCity('');
    setSpecialty('');
    setRadiusKm(10);
    setSourceFilter('all');
    setSortBy('distance');
    clearLocation();
    setUserCoords(null);
  };

  // Open appointment booking for DocNearby provider
  const handleRequestAppointment = async (providerId: string) => {
    try {
      setLoadingProviderId(providerId);
      const res = await fetch(`/api/v1/providers/${providerId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setBookingProvider(json.data);
        setIsBookingOpen(true);
      } else {
        alert('Could not load provider booking details. Please visit provider profile directly.');
      }
    } catch {
      alert('Network error loading provider profile.');
    } finally {
      setLoadingProviderId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            Unified Healthcare Discovery • Google Places &amp; DocNearby
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.discovery.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t.discovery.subtitle}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Row 1: Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Query Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-teal-600" />
              Doctor, Hospital, or Clinic
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Apollo, Dentist, Clinic"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Location / City Input with GPS Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Location
              </label>
              <button
                type="button"
                onClick={userCoords ? handleClearLocation : handleUseMyLocation}
                disabled={geoState === 'locating'}
                className={`text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                  userCoords
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
                title="Use device GPS location"
              >
                {geoState === 'locating' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                  </>
                ) : userCoords ? (
                  <>
                    <Navigation className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    {userCoords.source === 'ip' ? 'Network Loc' : 'GPS Active'}{' '}
                    <X className="w-3 h-3 ml-0.5 hover:text-red-600" />
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3 text-teal-600" /> Near Me
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (userCoords) {
                  setUserCoords(null);
                }
              }}
              placeholder={
                userCoords
                  ? userCoords.city
                    ? `Near ${userCoords.city}`
                    : 'Near Me (GPS Active)'
                  : 'e.g. Kolkata, Salt Lake'
              }
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            />
            {geoError && !userCoords && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{geoError}</span>
              </p>
            )}
            {userCoords && (
              <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-0.5">
                <span className="flex items-center gap-1 truncate">
                  <Navigation className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <strong>{userCoords.source === 'gps' ? 'Device GPS' : 'Network IP'}:</strong>{' '}
                  <span className="truncate">{userCoords.city || 'Active'}</span>
                </span>
                {userCoords.accuracy !== undefined && userCoords.accuracy > 0 && (
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                    ±{Math.round(userCoords.accuracy)}m
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search Radius */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              Radius (km)
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="2">Within 2 km (Walking)</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km (Standard)</option>
              <option value="25">Within 25 km (Metro area)</option>
              <option value="50">Within 50 km (Regional)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-600" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="distance">Nearest Distance</option>
              <option value="relevance">Relevance &amp; Verified First</option>
              <option value="rating">Google Rating</option>
            </select>
          </div>
        </div>

        {/* Row 2: Source Filter Tabs & View Mode */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Source Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.discovery.allSources}
              {meta && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                  {meta.total}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('docnearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'docnearby'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              {t.discovery.docnearbyOnly}
              {meta && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                  {meta.totalDocNearby}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSourceFilter('google_places')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'google_places'
                  ? 'bg-white text-indigo-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {t.discovery.googlePlacesOnly}
              {meta && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                  {meta.totalGooglePlaces}
                </span>
              )}
            </button>
          </div>

          {/* View Mode Toggle: Split / Cards / Map */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Split map and list view"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                {t.discovery.splitView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Cards only"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {t.discovery.cardsView}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'map'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Map view only"
              >
                <MapIcon className="w-3.5 h-3.5 text-teal-600" />
                {t.discovery.mapView}
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset all search filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.filters.resetAll}
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice if Google Places is unconfigured or degraded */}
      {meta && meta.googlePlacesStatus === 'unconfigured' && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              <strong>DocNearby Provider Discovery Active:</strong> Public Google Places API key is not currently configured. Displaying verified local DocNearby healthcare providers with full fee transparency.
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-8 text-center bg-white border border-rose-200 rounded-3xl shadow-xs space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Healthcare discovery error</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
          <button
            onClick={executeSearch}
            className="text-xs font-semibold px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
          >
            {t.discovery.retry}
          </button>
        </div>
      )}

      {/* Main Discovery View (Split, Cards, or Map) */}
      {!isLoading && !error && (
        <div>
          {viewMode === 'cards' ? (
            /* Cards Only Grid */
            results.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                <Compass className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  {t.discovery.noResultsTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {t.discovery.noResultsDesc}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                >
                  {t.discovery.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((listing) => (
                  <UnifiedResultCard
                    key={listing.id}
                    listing={listing}
                    isSelected={listing.id === selectedListingId}
                    onSelect={(l) => setSelectedListingId(l.id)}
                    onRequestAppointment={handleRequestAppointment}
                    onViewProfile={(l) => setActiveProfileListing(l)}
                  />
                ))}
              </div>
            )
          ) : viewMode === 'map' ? (
            /* Full Map View */
            <div className="space-y-4">
              <GoogleDiscoveryMap
                listings={results}
                selectedListingId={selectedListingId}
                onSelectListing={(listing) => setSelectedListingId(listing.id)}
                userCoordinates={userCoords}
                onRequestAppointment={handleRequestAppointment}
                onViewProfile={(l) => setActiveProfileListing(l)}
                onLocationSelect={(loc) => {
                  setCity(loc.name || loc.address);
                  setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
                  setSortBy('distance');
                }}
              />
            </div>
          ) : (
            /* Split View (Default): Map on Top/Right, Selectable Cards on Left */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Results List or Empty State */}
              <div className="lg:col-span-6 space-y-4 order-2 lg:order-1 max-h-[750px] overflow-y-auto pr-1">
                {results.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                    <Compass className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.discovery.noResultsTitle}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t.discovery.noResultsDesc}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 text-xs font-semibold px-4 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                      {t.discovery.resetFilters}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <span>
                        Showing {results.length} results ({meta?.totalDocNearby || 0} DocNearby,{' '}
                        {meta?.totalGooglePlaces || 0} Google Places)
                      </span>
                    </div>

                    <div className="space-y-4">
                      {results.map((listing) => (
                        <UnifiedResultCard
                          key={listing.id}
                          listing={listing}
                          isSelected={listing.id === selectedListingId}
                          onSelect={(l) => setSelectedListingId(l.id)}
                          onRequestAppointment={handleRequestAppointment}
                          onViewProfile={(l) => setActiveProfileListing(l)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Interactive Google Discovery Map */}
              <div className="lg:col-span-6 sticky top-6 order-1 lg:order-2">
                <GoogleDiscoveryMap
                  listings={results}
                  selectedListingId={selectedListingId}
                  onSelectListing={(listing) => setSelectedListingId(listing.id)}
                  userCoordinates={userCoords}
                  onRequestAppointment={handleRequestAppointment}
                  onViewProfile={(l) => setActiveProfileListing(l)}
                  onLocationSelect={(loc) => {
                    setCity(loc.name || loc.address);
                    setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
                    setSortBy('distance');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety & Policy Notice */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3 text-xs text-slate-600">
        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          DocNearby Discovery Source &amp; Verification Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-teal-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600" /> Registered on DocNearby
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Healthcare providers who maintain verified profiles with DocNearby. Consultation pricing is confirmed by clinic tariff cards, medical council credentials are statutory-verified, and direct appointment requests are supported.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-indigo-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Google-listed (Not verified by DocNearby)
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Healthcare places discovered via Google Places public directories. DocNearby does not verify their professional credentials, fee schedules, or practice status. Direct DocNearby appointment booking is unavailable.
            </p>
          </div>
        </div>
      </section>

      {/* Appointment Booking Modal for DocNearby Providers (CC-06 preservation) */}
      {bookingProvider && (
        <BookAppointmentModal
          provider={bookingProvider}
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setBookingProvider(null);
          }}
          onSuccess={() => {
            setIsBookingOpen(false);
            setBookingProvider(null);
            alert('Appointment request submitted successfully!');
          }}
        />
      )}

      {/* Google-style Business Profile Modal / Bottom Sheet */}
      {activeProfileListing && (
        <GooglePlaceProfileModal
          listing={activeProfileListing}
          onClose={() => setActiveProfileListing(null)}
          onRequestAppointment={handleRequestAppointment}
        />
      )}
    </div>
  );
}

