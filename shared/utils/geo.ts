/**
 * DocNearby Geospatial Utilities
 * Safe coordinate verification, Haversine geodetic distance calculation,
 * and universal turn-by-turn navigation URL generators.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Validate that numeric latitude and longitude fall within statutory geodetic limits.
 */
export function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculate Great-Circle distance between two points in kilometers using Haversine formula.
 * Returns distance in kilometers rounded to 1 decimal place.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error('Invalid coordinate bounds provided for Haversine calculation');
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Human-readable distance display format for travelers.
 * Returns e.g. "450 m" for sub-kilometer distances or "2.4 km" for greater distances.
 */
export function formatDistance(distanceKm: number): string {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
    return '';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Universal Web Intent URL for turn-by-turn navigation.
 * Compatible across all Android, iOS, and desktop browsers without API keys.
 */
export function getDirectionsUrl(lat: number, lon: number, destinationName?: string): string {
  const query = destinationName
    ? `${lat},${lon} (${destinationName})`
    : `${lat},${lon}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
