'use client';

import { useState, useCallback } from 'react';

export type GeolocationState = 'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'timeout';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  source?: 'gps' | 'ip' | 'fallback';
}

export interface UseGeolocationReturn {
  state: GeolocationState;
  coordinates: GeolocationCoordinates | null;
  errorMessage: string | null;
  requestLocation: () => Promise<GeolocationCoordinates | null>;
  clearLocation: () => void;
}

/**
 * Helper to fetch IP-based geolocation fallback when browser GPS is denied/unavailable
 */
async function fetchIpLocation(): Promise<GeolocationCoordinates | null> {
  try {
    const res = await fetch('/api/v1/geo/ip');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && typeof json.latitude === 'number' && typeof json.longitude === 'number') {
      return {
        latitude: json.latitude,
        longitude: json.longitude,
        city: json.city,
        source: json.source || 'ip',
      };
    }
  } catch {
    // Network error on IP lookup
  }
  return null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>('idle');
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      setState('locating');
      setErrorMessage(null);

      // 1. Check if browser geolocation is supported
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        // Fallback directly to IP geolocation
        fetchIpLocation()
          .then((ipCoords) => {
            if (ipCoords) {
              setCoordinates(ipCoords);
              setState('success');
              setErrorMessage(null);
              resolve(ipCoords);
            } else {
              setState('unavailable');
              setErrorMessage('Location could not be determined. Please search by city or locality manually.');
              resolve(null);
            }
          })
          .catch(() => {
            setState('unavailable');
            setErrorMessage('Location service unavailable. Manual search remains available.');
            resolve(null);
          });
        return;
      }

      // 2. Request browser GPS location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps',
          };
          setCoordinates(coords);
          setState('success');
          setErrorMessage(null);
          resolve(coords);
        },
        async (error) => {
          console.warn(`Browser geolocation failed (${error.code}: ${error.message}). Attempting IP fallback...`);

          // 3. Graceful Fallback: Resolve via Network IP location
          const ipCoords = await fetchIpLocation();
          if (ipCoords) {
            setCoordinates(ipCoords);
            setState('success');
            setErrorMessage(null);
            resolve(ipCoords);
            return;
          }

          // 4. If even IP fallback fails, surface descriptive guidance
          setCoordinates(null);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setState('denied');
              setErrorMessage('Location permission was denied. Please allow location in your browser address bar or search by city manually.');
              break;
            case error.POSITION_UNAVAILABLE:
              setState('unavailable');
              setErrorMessage('GPS signal unavailable. Please search by entering your city or locality manually.');
              break;
            case error.TIMEOUT:
              setState('timeout');
              setErrorMessage('Location request timed out. Please search by entering your city manually.');
              break;
            default:
              setState('unavailable');
              setErrorMessage('Unable to determine location. Manual search remains available.');
              break;
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true, // Request GPS for mobile / precise positioning
          timeout: 7000,            // 7-second timeout before IP fallback
          maximumAge: 60000,        // 1-minute cache
        }
      );
    });
  }, []);

  const clearLocation = useCallback(() => {
    setState('idle');
    setCoordinates(null);
    setErrorMessage(null);
  }, []);

  return {
    state,
    coordinates,
    errorMessage,
    requestLocation,
    clearLocation,
  };
}
