'use client';

import { useState, useCallback } from 'react';

export type GeolocationState = 'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'timeout';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UseGeolocationReturn {
  state: GeolocationState;
  coordinates: GeolocationCoordinates | null;
  errorMessage: string | null;
  requestLocation: () => Promise<GeolocationCoordinates | null>;
  clearLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>('idle');
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        setState('unavailable');
        setErrorMessage('Geolocation is not supported by your browser. Please search by city or locality manually.');
        resolve(null);
        return;
      }

      setState('locating');
      setErrorMessage(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoordinates(coords);
          setState('success');
          setErrorMessage(null);
          resolve(coords);
        },
        (error) => {
          setCoordinates(null);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setState('denied');
              setErrorMessage('Location permission was denied. You can search by entering your city or locality manually.');
              break;
            case error.POSITION_UNAVAILABLE:
              setState('unavailable');
              setErrorMessage('Location information is currently unavailable. Please search by entering your city or locality.');
              break;
            case error.TIMEOUT:
              setState('timeout');
              setErrorMessage('Location request timed out. Please check your network or search manually.');
              break;
            default:
              setState('unavailable');
              setErrorMessage('An error occurred while retrieving your location. Manual search remains available.');
              break;
          }
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Fast, low-battery query
          timeout: 10000,           // 10s timeout
          maximumAge: 300000,       // 5m cached position permitted
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
