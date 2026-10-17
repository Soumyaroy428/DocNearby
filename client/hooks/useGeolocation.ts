'use client';

import { useState, useCallback } from 'react';

export type GeolocationState = 'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'timeout';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  locality?: string;
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
 * Reverse geocode coordinates to get the human-readable locality & city name
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<{ city?: string; locality?: string }> {
  try {
    const res = await fetch(`/api/v1/geo/reverse?latitude=${latitude}&longitude=${longitude}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          city: json.formatted || json.city,
          locality: json.locality,
        };
      }
    }
  } catch {
    // Non-blocking fallback
  }
  return {};
}

/**
 * Fetch IP-based geolocation fallback when browser GPS is denied/unavailable
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
        source: 'ip',
      };
    }
  } catch {
    // Network error on IP lookup
  }
  return null;
}

/**
 * Helper to wrap navigator.geolocation.getCurrentPosition with Promise
 */
function getBrowserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>('idle');
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    setState('locating');
    setErrorMessage(null);

    // 1. Check permission if Permissions API is supported
    let isExplicitlyDenied = false;
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (status.state === 'denied') {
          isExplicitlyDenied = true;
        }
      }
    } catch {
      // Ignore permission query error
    }

    // If permission was already permanently blocked in browser settings, use IP fallback:
    if (isExplicitlyDenied || typeof window === 'undefined' || !('geolocation' in navigator)) {
      const ipCoords = await fetchIpLocation();
      if (ipCoords) {
        const rev = await reverseGeocode(ipCoords.latitude, ipCoords.longitude);
        const resolved: GeolocationCoordinates = {
          ...ipCoords,
          city: rev.city || ipCoords.city,
          locality: rev.locality,
          source: 'ip',
        };
        setCoordinates(resolved);
        setState('success');
        setErrorMessage(null);
        return resolved;
      }
      setState('denied');
      setErrorMessage('Location permission was denied. Please allow location access in your browser or search by city.');
      return null;
    }

    // 2. Primary Attempt: High-accuracy GPS / Wi-Fi positioning (10s timeout gives time for prompt & GPS lock)
    try {
      const position = await getBrowserPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      const rev = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      const resolved: GeolocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        city: rev.city,
        locality: rev.locality,
        source: 'gps',
      };

      setCoordinates(resolved);
      setState('success');
      setErrorMessage(null);
      return resolved;
    } catch (primaryErr: unknown) {
      const geoErr = primaryErr as GeolocationPositionError;

      // If user explicitly clicked "Block" / denied permission:
      if (geoErr && geoErr.code === 1) { // PERMISSION_DENIED
        console.warn('Browser GPS permission denied by user. Falling back to approximate IP location...');
        const ipCoords = await fetchIpLocation();
        if (ipCoords) {
          const rev = await reverseGeocode(ipCoords.latitude, ipCoords.longitude);
          const resolved: GeolocationCoordinates = {
            ...ipCoords,
            city: rev.city || ipCoords.city,
            locality: rev.locality,
            source: 'ip',
          };
          setCoordinates(resolved);
          setState('success');
          setErrorMessage(null);
          return resolved;
        }
        setState('denied');
        setErrorMessage('Location permission was denied. Please type your city manually.');
        return null;
      }

      // If high accuracy timed out or was unavailable on this hardware (e.g. desktop without GPS):
      console.warn('High-accuracy GPS attempt failed, retrying with low-accuracy triangulation...');
      try {
        const position = await getBrowserPosition({
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 60000,
        });

        const rev = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        const resolved: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          city: rev.city,
          locality: rev.locality,
          source: 'gps',
        };

        setCoordinates(resolved);
        setState('success');
        setErrorMessage(null);
        return resolved;
      } catch {
        // Both browser attempts failed, fallback to network IP location
        console.warn('Browser positioning unavailable. Falling back to network IP location...');
        const ipCoords = await fetchIpLocation();
        if (ipCoords) {
          const rev = await reverseGeocode(ipCoords.latitude, ipCoords.longitude);
          const resolved: GeolocationCoordinates = {
            ...ipCoords,
            city: rev.city || ipCoords.city,
            locality: rev.locality,
            source: 'ip',
          };
          setCoordinates(resolved);
          setState('success');
          setErrorMessage(null);
          return resolved;
        }

        setCoordinates(null);
        setState('unavailable');
        setErrorMessage('Could not determine your location. Please enter your city manually.');
        return null;
      }
    }
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
