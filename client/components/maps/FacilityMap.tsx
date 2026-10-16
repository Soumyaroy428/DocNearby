'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Accessibility, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { Facility } from '@/shared/types/provider';
import { getDirectionsUrl } from '@/shared/utils/geo';

interface FacilityMapProps {
  facility: Facility;
}

export function FacilityMap({ facility }: FacilityMapProps) {
  const [mapError, setMapError] = useState(false);
  const hasCoordinates =
    facility.location?.coordinates &&
    Array.isArray(facility.location.coordinates) &&
    facility.location.coordinates.length === 2;

  const lon = hasCoordinates ? facility.location!.coordinates[0] : null;
  const lat = hasCoordinates ? facility.location!.coordinates[1] : null;

  // Compute a bounding box around the facility point (approx ±0.008 deg ~ 800m)
  const delta = 0.008;
  const osmEmbedUrl =
    lat !== null && lon !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lon - delta).toFixed(4)}%2C${(lat - delta).toFixed(4)}%2C${(lon + delta).toFixed(4)}%2C${(lat + delta).toFixed(4)}&layer=mapnik&marker=${lat.toFixed(4)}%2C${lon.toFixed(4)}`
      : null;

  const directionsUrl =
    lat !== null && lon !== null
      ? getDirectionsUrl(lat, lon, facility.name)
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name}, ${facility.address}, ${facility.city}`)}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-4 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{facility.name}</h3>
            <p className="text-xs text-slate-500">
              {facility.address}, {facility.locality}, {facility.city}
            </p>
            {facility.hours && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Hours: {facility.hours}</span>
              </div>
            )}
          </div>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Get Directions
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>

      {/* Interactive Map Frame / Fallback */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {osmEmbedUrl && !mapError ? (
          <iframe
            title={`Map view of ${facility.name}`}
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            onError={() => setMapError(true)}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-slate-50">
            <MapPin className="w-8 h-8 text-teal-600" />
            <h4 className="text-xs font-bold text-slate-800">
              {facility.name}
            </h4>
            <p className="text-xs text-slate-600 max-w-sm">
              {facility.address}, {facility.locality}, {facility.city}, {facility.country}
            </p>
            {hasCoordinates && (
              <p className="text-[11px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                GPS: {lat?.toFixed(4)}° N, {lon?.toFixed(4)}° E
              </p>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-700 hover:underline font-semibold"
            >
              Open navigation in external maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {osmEmbedUrl && !mapError && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200">
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
          </div>
        )}
      </div>

      {/* Accessibility & Landmark Features */}
      {facility.accessibilityAttributes && facility.accessibilityAttributes.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
            <Accessibility className="w-3.5 h-3.5 text-teal-600" />
            Verified Facility Accessibility Features
          </span>
          <div className="flex flex-wrap gap-2">
            {facility.accessibilityAttributes.map((attr) => (
              <span
                key={attr}
                className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 font-medium"
              >
                ✓ {attr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
