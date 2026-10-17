'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  Maximize2,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { UnifiedHealthcareListing } from '@/shared/types/discovery';
import { formatDistance } from '@/shared/utils/geo';
import { formatPaiseToRupees } from '@/shared/utils/formatters';

interface GoogleDiscoveryMapProps {
  listings: UnifiedHealthcareListing[];
  selectedListingId?: string;
  onSelectListing: (listing: UnifiedHealthcareListing) => void;
  center?: { latitude: number; longitude: number };
  userCoordinates?: { latitude: number; longitude: number } | null;
  onRequestAppointment?: (providerId: string, providerName: string) => void;
  onLocationSelect?: (location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

declare global {
  interface Window {
    google?: any;
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
  }
}

export function GoogleDiscoveryMap({
  listings,
  selectedListingId,
  onSelectListing,
  center,
  userCoordinates,
  onRequestAppointment,
  onLocationSelect,
}: GoogleDiscoveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const activeInfoWindowRef = useRef<any>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const placeSearchMarkerRef = useRef<any>(null);
  const placeSearchInfoWindowRef = useRef<any>(null);

  const [mapEngine, setMapEngine] = useState<'google' | 'fallback'>('google');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter listings with valid coordinates
  const validListings = listings.filter(
    (l) =>
      typeof l.location?.latitude === 'number' &&
      typeof l.location?.longitude === 'number' &&
      !isNaN(l.location.latitude) &&
      !isNaN(l.location.longitude)
  );

  const selectedListing =
    validListings.find((l) => l.id === selectedListingId) || validListings[0];

  const mapCenterLat =
    center?.latitude ??
    selectedListing?.location.latitude ??
    userCoordinates?.latitude ??
    22.5726; // Default Kolkata
  const mapCenterLon =
    center?.longitude ??
    selectedListing?.location.longitude ??
    userCoordinates?.longitude ??
    88.3639;

  // Load Google Maps JavaScript SDK
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Graceful fallback to OpenStreetMap if no client API key
      setMapEngine('fallback');
      setIsLoading(false);
      return;
    }

    if (window.google?.maps) {
      setMapEngine('google');
      setIsLoading(false);
      return;
    }

    if (window.__googleMapsLoading) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          setMapEngine('google');
          setIsLoading(false);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    window.__googleMapsLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&solution_channel=GMP_GE_mapsandplacesautocomplete_v2`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.__googleMapsLoaded = true;
      window.__googleMapsLoading = false;
      setMapEngine('google');
      setIsLoading(false);
    };

    script.onerror = () => {
      window.__googleMapsLoading = false;
      setLoadError('Google Maps JavaScript SDK failed to load. Falling back to alternative map view.');
      setMapEngine('fallback');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize and update Google Map instance
  useEffect(() => {
    if (mapEngine !== 'google' || !window.google?.maps || !mapContainerRef.current) {
      return;
    }

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: mapCenterLat, lng: mapCenterLon },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi.medical',
              elementType: 'geometry',
              stylers: [{ color: '#e8f5e9' }],
            },
          ],
        });
      }

      // Clear old markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();

      const bounds = new window.google.maps.LatLngBounds();

      // Place user location marker if available
      if (userCoordinates) {
        new window.google.maps.Marker({
          position: { lat: userCoordinates.latitude, lng: userCoordinates.longitude },
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#0284c7', // Sky-600
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
        bounds.extend({ lat: userCoordinates.latitude, lng: userCoordinates.longitude });
      }

      // Place markers for each healthcare listing
      validListings.forEach((listing) => {
        const isDocNearby = listing.source === 'docnearby';
        const isSelected = listing.id === selectedListingId;

        // Custom pin color: Teal for DocNearby, Indigo for Google Places
        const pinColor = isDocNearby ? '#0d9488' : '#6366f1';

        const marker = new window.google.maps.Marker({
          position: {
            lat: listing.location.latitude,
            lng: listing.location.longitude,
          },
          map: mapInstanceRef.current,
          title: listing.name,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: pinColor,
            fillOpacity: 1,
            strokeColor: isSelected ? '#0f172a' : '#ffffff',
            strokeWeight: isSelected ? 3 : 1.5,
            scale: isSelected ? 1.8 : 1.4,
            anchor: new window.google.maps.Point(12, 22),
          },
          zIndex: isSelected ? 999 : isDocNearby ? 100 : 50,
        });

        marker.addListener('click', () => {
          onSelectListing(listing);

          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
          }

          const contentString = `
            <div style="font-family: inherit; padding: 6px; max-width: 240px; color: #1e293b;">
              <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${
                isDocNearby ? '#f0fdfa; color: #0f766e;' : '#eef2ff; color: #4338ca;'
              }">
                ${listing.sourceBadge.label}
              </div>
              <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${listing.name}</h4>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${listing.address}</p>
              ${
                listing.distanceKm !== undefined
                  ? `<span style="font-size: 11px; font-weight: 600; color: #047857;">${formatDistance(
                      listing.distanceKm
                    )}</span>`
                  : ''
              }
            </div>
          `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: contentString,
          });

          infoWindow.open(mapInstanceRef.current, marker);
          activeInfoWindowRef.current = infoWindow;
        });

        markersRef.current.set(listing.id, marker);
        bounds.extend({
          lat: listing.location.latitude,
          lng: listing.location.longitude,
        });
      });

      // Fit bounds if multiple results exist
      if (validListings.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        });
      } else if (validListings.length === 1) {
        mapInstanceRef.current.setCenter({
          lat: validListings[0].location.latitude,
          lng: validListings[0].location.longitude,
        });
        mapInstanceRef.current.setZoom(14);
      }
    } catch (err) {
      console.error('Google Maps init error:', err);
      setMapEngine('fallback');
    }
  }, [mapEngine, validListings, selectedListingId, userCoordinates, mapCenterLat, mapCenterLon, onSelectListing]);

  // Center on selected listing when changed
  useEffect(() => {
    if (mapEngine === 'google' && mapInstanceRef.current && selectedListing) {
      mapInstanceRef.current.panTo({
        lat: selectedListing.location.latitude,
        lng: selectedListing.location.longitude,
      });

      const marker = markersRef.current.get(selectedListing.id);
      if (marker && window.google?.maps) {
        marker.setAnimation(window.google.maps.Animation.DROP);
      }
    }
  }, [selectedListingId, mapEngine, selectedListing]);

  const handleFitBounds = useCallback(() => {
    if (mapEngine === 'google' && mapInstanceRef.current && validListings.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validListings.forEach((l) =>
        bounds.extend({ lat: l.location.latitude, lng: l.location.longitude })
      );
      if (userCoordinates) {
        bounds.extend({ lat: userCoordinates.latitude, lng: userCoordinates.longitude });
      }
      mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [mapEngine, validListings, userCoordinates]);

  // Initialize Google Places Autocomplete on Place Picker search input
  useEffect(() => {
    if (
      mapEngine !== 'google' ||
      !window.google?.maps?.places ||
      !mapInstanceRef.current ||
      !autocompleteInputRef.current
    ) {
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          fields: ['geometry', 'name', 'formatted_address', 'place_id'],
        }
      );

      autocomplete.bindTo('bounds', mapInstanceRef.current);
      autocompleteRef.current = autocomplete;

      if (!placeSearchMarkerRef.current) {
        placeSearchMarkerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          anchorPoint: new window.google.maps.Point(0, -29),
          visible: false,
        });
      }

      if (!placeSearchInfoWindowRef.current) {
        placeSearchInfoWindowRef.current = new window.google.maps.InfoWindow();
      }

      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          if (place.name) {
            window.alert("No location details available for input: '" + place.name + "'");
          }
          if (placeSearchInfoWindowRef.current) {
            placeSearchInfoWindowRef.current.close();
          }
          if (placeSearchMarkerRef.current) {
            placeSearchMarkerRef.current.setVisible(false);
          }
          return;
        }

        if (place.geometry.viewport) {
          mapInstanceRef.current.fitBounds(place.geometry.viewport);
        } else {
          mapInstanceRef.current.setCenter(place.geometry.location);
          mapInstanceRef.current.setZoom(17);
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        placeSearchMarkerRef.current.setPosition(place.geometry.location);
        placeSearchMarkerRef.current.setVisible(true);

        const content = `
          <div style="font-family: inherit; padding: 4px 6px; color: #0f172a; max-width: 220px;">
            <strong style="font-size: 13px;">${place.name || 'Selected Place'}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">${place.formatted_address || ''}</span>
          </div>
        `;
        placeSearchInfoWindowRef.current.setContent(content);
        placeSearchInfoWindowRef.current.open(mapInstanceRef.current, placeSearchMarkerRef.current);

        if (onLocationSelect) {
          onLocationSelect({
            name: place.name || place.formatted_address || '',
            address: place.formatted_address || '',
            latitude: lat,
            longitude: lng,
          });
        }
      });

      return () => {
        if (window.google?.maps?.event && listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch {
      // Non-blocking fallback if Autocomplete is restricted
    }
  }, [mapEngine, onLocationSelect]);

  // Fallback map URL using OpenStreetMap embed
  const delta = 0.02;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(
    mapCenterLon - delta
  ).toFixed(4)}%2C${(mapCenterLat - delta).toFixed(4)}%2C${(
    mapCenterLon + delta
  ).toFixed(4)}%2C${(mapCenterLat + delta).toFixed(4)}&layer=mapnik&marker=${mapCenterLat.toFixed(
    4
  )}%2C${mapCenterLon.toFixed(4)}`;

  return (
    <div className="relative w-full h-[500px] lg:h-[600px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex flex-col">
      {/* Top Map Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-bold text-slate-800">
            {validListings.length} Healthcare Locations Mapped
          </span>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-600" /> DocNearby
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Google Places
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Google Places Autocomplete Place Picker */}
          {mapEngine === 'google' && (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
              <Search className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="Enter an address or locality..."
                className="bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 w-36 sm:w-56"
              />
            </div>
          )}

          {mapEngine === 'google' && validListings.length > 1 && (
            <button
              type="button"
              onClick={handleFitBounds}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm text-xs font-semibold transition-colors"
              title="Fit all markers in view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
              Fit All
            </button>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-xs space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs font-medium text-slate-600">Loading map discovery...</p>
        </div>
      )}

      {/* Google Maps JS View */}
      {mapEngine === 'google' && (
        <div ref={mapContainerRef} className="w-full h-full" />
      )}

      {/* Fallback Map View (OpenStreetMap embed when API key is unconfigured or script failed) */}
      {mapEngine === 'fallback' && (
        <div className="w-full h-full relative">
          <iframe
            title="Healthcare Discovery Map"
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />

          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200 z-10">
            Map view • Powered by OpenStreetMap & Google Web Intents
          </div>

          {loadError && (
            <div className="absolute top-14 left-3 right-3 bg-amber-50/95 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 z-10 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                {loadError}
              </span>
              <button
                onClick={() => setLoadError(null)}
                className="text-amber-700 font-bold hover:underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Provider Floating Quick-Action Card */}
      {selectedListing && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-lg space-y-2.5 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedListing.source === 'docnearby'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {selectedListing.sourceBadge.label}
                </span>

                {selectedListing.verificationStatus === 'verified' && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                )}

                {selectedListing.distanceKm !== undefined && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {formatDistance(selectedListing.distanceKm)}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 truncate">
                {selectedListing.name}
              </h4>
              <p className="text-xs text-slate-500 truncate">{selectedListing.address}</p>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">Fee:</span>
            {selectedListing.pricing.isAvailable && selectedListing.pricing.amountMinor !== undefined ? (
              <span className="font-bold text-slate-900">
                {formatPaiseToRupees(selectedListing.pricing.amountMinor)}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] italic">
                {selectedListing.pricing.sourceLabel}
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={selectedListing.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              Directions
            </a>

            {selectedListing.booking.isAvailable && selectedListing.booking.providerId ? (
              <button
                type="button"
                onClick={() => {
                  if (onRequestAppointment) {
                    onRequestAppointment(
                      selectedListing.booking.providerId!,
                      selectedListing.name
                    );
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Book Slot
              </button>
            ) : (
              <span
                className="text-[10px] text-slate-400 italic px-2 py-1 text-center"
                title="Direct booking only for registered DocNearby providers"
              >
                External listing
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

