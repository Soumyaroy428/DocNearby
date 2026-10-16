'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  IndianRupee,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Provider } from '@/shared/types/provider';
import { formatDistance, getDirectionsUrl } from '@/shared/utils/geo';
import { formatPaiseToRupees, getVerificationBadge } from '@/shared/utils/formatters';

interface ProviderMapViewProps {
  providers: Provider[];
  userCoordinates?: { latitude: number; longitude: number } | null;
  onSelectProvider?: (provider: Provider) => void;
}

export function ProviderMapView({
  providers,
  userCoordinates,
  onSelectProvider,
}: ProviderMapViewProps) {
  // Extract all providers with valid coordinates
  const validProviders = providers.filter((p) =>
    p.facilities.some(
      (f) =>
        f.location?.coordinates &&
        Array.isArray(f.location.coordinates) &&
        f.location.coordinates.length === 2
    )
  );

  const [selectedId, setSelectedId] = useState<string>(
    validProviders[0]?.id || providers[0]?.id || ''
  );

  const selectedProvider =
    providers.find((p) => p.id === selectedId) || validProviders[0] || providers[0];

  const selectedFacility = selectedProvider?.facilities[0];
  const selectedCoordinates = selectedFacility?.location?.coordinates;
  const selLon = selectedCoordinates ? selectedCoordinates[0] : null;
  const selLat = selectedCoordinates ? selectedCoordinates[1] : null;

  // Compute map center from selected provider or user coordinates
  const centerLat = selLat ?? userCoordinates?.latitude ?? 22.5726; // Default Kolkata
  const centerLon = selLon ?? userCoordinates?.longitude ?? 88.3639;

  const delta = 0.015;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(centerLon - delta).toFixed(4)}%2C${(centerLat - delta).toFixed(4)}%2C${(centerLon + delta).toFixed(4)}%2C${(centerLat + delta).toFixed(4)}&layer=mapnik&marker=${centerLat.toFixed(4)}%2C${centerLon.toFixed(4)}`;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-900">
            Healthcare Facility Locations ({validProviders.length} mapped)
          </span>
        </div>

        {userCoordinates && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Using your current location for nearby sorting</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[480px]">
        {/* Left Side: Selectable Provider Pins List */}
        <div className="lg:col-span-1 border-r border-slate-200 max-h-[500px] overflow-y-auto divide-y divide-slate-100">
          {validProviders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <MapPin className="w-6 h-6 mx-auto text-slate-400" />
              <p>No mapped facilities in current filter view.</p>
            </div>
          ) : (
            validProviders.map((provider) => {
              const isSelected = provider.id === selectedId;
              const facility = provider.facilities[0];
              const primaryService = provider.services[0];
              const verification = getVerificationBadge(provider.verificationStatus);

              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedId(provider.id);
                    if (onSelectProvider) onSelectProvider(provider);
                  }}
                  className={`w-full text-left p-4 transition-all hover:bg-slate-50 flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-teal-50/60 border-l-4 border-l-teal-600' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {provider.displayName}
                      </span>
                      {provider.distanceKm !== undefined && (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          {formatDistance(provider.distanceKm)}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      {facility?.name} • {facility?.locality}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      {primaryService && (
                        <span className="font-semibold text-slate-800">
                          {formatPaiseToRupees(primaryService.amountMinor)}
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{provider.specialties[0]}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isSelected ? 'text-teal-700 translate-x-0.5' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Right Side: Interactive Map & Selected Preview Card */}
        <div className="lg:col-span-2 relative min-h-[350px] lg:min-h-[500px] bg-slate-100">
          <iframe
            title="Interactive Map of Providers"
            src={embedUrl}
            className="w-full h-full border-0 absolute inset-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />

          {/* Floating Selected Provider Card */}
          {selectedProvider && selectedFacility && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-3 z-10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-medium bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                      {selectedProvider.specialties[0]}
                    </span>
                    {selectedProvider.distanceKm !== undefined && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                        {formatDistance(selectedProvider.distanceKm)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedProvider.displayName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedFacility.name} — {selectedFacility.address}, {selectedFacility.locality}
                  </p>
                </div>
              </div>

              {selectedFacility.accessibilityAttributes &&
                selectedFacility.accessibilityAttributes.length > 0 && (
                  <div className="text-[10px] text-slate-600 flex items-center gap-1">
                    <span className="text-teal-700 font-semibold">Accessibility:</span>
                    <span className="truncate">
                      {selectedFacility.accessibilityAttributes.join(', ')}
                    </span>
                  </div>
                )}

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Link
                  href={`/providers/${selectedProvider.id}`}
                  className="flex-1 text-center py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
                >
                  View Profile & Fees
                </Link>

                {selLat !== null && selLon !== null && (
                  <a
                    href={getDirectionsUrl(selLat, selLon, selectedFacility.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                    title="Get Directions in Google Maps"
                  >
                    <Navigation className="w-4 h-4 text-teal-700" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-slate-500 border border-slate-200 z-10">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
          </div>
        </div>
      </div>
    </div>
  );
}

