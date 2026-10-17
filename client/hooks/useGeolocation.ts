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
      const cleanCity = json.city ? json.city.split(',')[0].trim() : undefined;
      return {
        latitude: json.latitude,
        longitude: json.longitude,
        city: cleanCity,
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

  const requestLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    setState('locating');
    setErrorMessage(null);

    // 1. Check permission if Permissions API is supported
    let isDenied = false;
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          isDenied = true;
        }
      }
    } catch {
      // Ignore permission query error
    }

    // If permission is already denied or geolocation is unsupported, resolve via IP immediately:
    if (isDenied || typeof window === 'undefined' || !('geolocation' in navigator)) {
      const ipCoords = await fetchIpLocation();
      if (ipCoords) {
        setCoordinates(ipCoords);
        setState('success');
        setErrorMessage(null);
        return ipCoords;
      }
      setState('denied');
      setErrorMessage('Location permission was denied. Please search by entering your city manually.');
      return null;
    }

    // 2. Request browser GPS with a fast 3.5-second timeout, falling back smoothly to IP
    return new Promise((resolve) => {
      let resolved = false;

      // Safety fallback timer: if browser GPS doesn't respond within 3.5s (common on desktop PCs), fallback to IP immediately:
      const timeoutFallback = setTimeout(async () => {
        if (!resolved) {
          resolved = true;
          const ipCoords = await fetchIpLocation();
          if (ipCoords) {
            setCoordinates(ipCoords);
            setState('success');
            setErrorMessage(null);
            resolve(ipCoords);
          } else {
            setState('timeout');
            setErrorMessage('Location request timed out. Please enter your city manually.');
            resolve(null);
          }
        }
      }, 3500);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutFallback);

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
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutFallback);

          console.warn(`Browser GPS unavailable (${error.code}: ${error.message}). Falling back to network IP location...`);
          const ipCoords = await fetchIpLocation();
          if (ipCoords) {
            setCoordinates(ipCoords);
            setState('success');
            setErrorMessage(null);
            resolve(ipCoords);
          } else {
            setCoordinates(null);
            setState('unavailable');
            setErrorMessage('Could not determine your location. Please type your city manually.');
            resolve(null);
          }
        },
        {
          enableHighAccuracy: false, // Fast, low-latency triangulation
          timeout: 3000,
          maximumAge: 60000,
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
