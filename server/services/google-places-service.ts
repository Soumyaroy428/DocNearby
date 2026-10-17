/**
 * Google Places API Integration Service
 * Discovers healthcare facilities (doctors, clinics, hospitals, pharmacies)
 * using the official Google Places API with explicit field masks,
 * in-memory caching, sanitization, and graceful failure handling.
 */

import { GooglePlaceRaw } from '@/shared/types/discovery';

export interface GooglePlacesSearchOptions {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  query?: string;
  specialty?: string;
  limit?: number;
}

export interface GooglePlacesSearchResult {
  places: GooglePlaceRaw[];
  status: 'ok' | 'unconfigured' | 'unavailable' | 'error';
  message?: string;
}

interface CacheEntry {
  data: GooglePlaceRaw[];
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds timeout

// Standard healthcare place types recognized by Google Places API
const HEALTHCARE_PLACE_TYPES = [
  'hospital',
  'doctor',
  'pharmacy',
  'medical_clinic',
  'physiotherapist',
  'dentist',
];

const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.rating,places.userRatingCount,places.types,places.googleMapsUri';

export class GooglePlacesService {
  private cache = new Map<string, CacheEntry>();
  private apiKey: string | null = null;
  private fetchFn: typeof fetch;

  constructor(apiKey?: string, fetchFn: typeof fetch = fetch) {
    this.apiKey =
      apiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.MAPS_API_KEY ||
      null;
    this.fetchFn = fetchFn;
  }

  /**
   * Set API key dynamically (useful for tests and runtime configuration)
   */
  setApiKey(key: string | null) {
    this.apiKey = key;
  }

  /**
   * Clear in-memory cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Search healthcare locations via Nearby Search or Text Search
   */
  async searchHealthcarePlaces(
    options: GooglePlacesSearchOptions
  ): Promise<GooglePlacesSearchResult> {
    const key =
      this.apiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.MAPS_API_KEY;

    if (!key) {
      return {
        places: [],
        status: 'unconfigured',
        message: 'Google Places API key is not configured. External discovery is unavailable.',
      };
    }

    const cacheKey = this.getCacheKey(options);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        places: cached.data,
        status: 'ok',
      };
    }

    try {
      let places: GooglePlaceRaw[] = [];

      if (options.query || options.specialty) {
        // Text Search
        const textQuery = [options.query, options.specialty, 'healthcare doctor clinic hospital']
          .filter(Boolean)
          .join(' ');

        places = await this.executeTextSearch(textQuery, options, key);
      } else if (
        typeof options.latitude === 'number' &&
        typeof options.longitude === 'number'
      ) {
        // Nearby Search
        places = await this.executeNearbySearch(
          options.latitude,
          options.longitude,
          (options.radiusKm || 10) * 1000,
          options.limit || 20,
          key
        );
      } else {
        // Fallback default query for broad search if no coords or query
        places = await this.executeTextSearch('hospital clinic doctor', options, key);
      }

      // Sanitize external output
      const sanitized = places.map((p) => this.sanitizePlace(p));

      // Store in memory cache
      this.cache.set(cacheKey, {
        data: sanitized,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return {
        places: sanitized,
        status: 'ok',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown Google Places error';
      return {
        places: [],
        status: 'unavailable',
        message: `Google Places discovery unavailable: ${message}`,
      };
    }
  }

  /**
   * Helper to build request headers with appropriate Referer to support HTTP Referrer restricted keys
   */
  private getHeaders(key: string, customFieldMask?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': customFieldMask || FIELD_MASK,
    };

    // When keys have HTTP Referrer restrictions in Google Cloud Console,
    // server-side requests must provide an authorized Referer matching the console restriction:
    const referer =
      process.env.NODE_ENV === 'development'
        ? (process.env.NEXTAUTH_URL || 'http://localhost:3000/')
        : 'https://docnearby.vercel.app/';

    headers['Referer'] = referer.endsWith('/') ? referer : `${referer}/`;
    return headers;
  }

  /**
   * Search nearby using Google Places API (New)
   */
  private async executeNearbySearch(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    limit: number,
    key: string
  ): Promise<GooglePlaceRaw[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = 'https://places.googleapis.com/v1/places:searchNearby';
      const body = {
        includedTypes: HEALTHCARE_PLACE_TYPES,
        maxResultCount: Math.min(limit, 20),
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: Math.min(radiusMeters, 50000), // Max 50km
          },
        },
      };

      const response = await this.fetchFn(endpoint, {
        method: 'POST',
        headers: this.getHeaders(key),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Places HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const json = await response.json();
      return Array.isArray(json.places) ? json.places : [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Text search using Google Places API (New)
   */
  private async executeTextSearch(
    queryText: string,
    options: GooglePlacesSearchOptions,
    key: string
  ): Promise<GooglePlaceRaw[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = 'https://places.googleapis.com/v1/places:searchText';
      const body: Record<string, unknown> = {
        textQuery: queryText,
        maxResultCount: Math.min(options.limit || 20, 20),
      };

      if (typeof options.latitude === 'number' && typeof options.longitude === 'number') {
        body.locationBias = {
          circle: {
            center: {
              latitude: options.latitude,
              longitude: options.longitude,
            },
            radius: Math.min((options.radiusKm || 10) * 1000, 50000),
          },
        };
      }

      const response = await this.fetchFn(endpoint, {
        method: 'POST',
        headers: this.getHeaders(key),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Places HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const json = await response.json();
      return Array.isArray(json.places) ? json.places : [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch individual place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceRaw | null> {
    const key =
      this.apiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.MAPS_API_KEY;

    if (!key || !placeId) return null;

    const cacheKey = `details:${placeId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data[0] || null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
      const response = await this.fetchFn(endpoint, {
        method: 'GET',
        headers: this.getHeaders(
          key,
          'id,displayName,formattedAddress,location,nationalPhoneNumber,websiteUri,regularOpeningHours,rating,userRatingCount,types,googleMapsUri'
        ),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const place: GooglePlaceRaw = await response.json();
      const sanitized = this.sanitizePlace(place);

      this.cache.set(cacheKey, {
        data: [sanitized],
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return sanitized;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sanitize external Google Place data
   */
  private sanitizePlace(place: GooglePlaceRaw): GooglePlaceRaw {
    return {
      id: String(place.id || '').trim(),
      displayName: place.displayName
        ? {
            text: this.stripUnsafeCharacters(place.displayName.text || ''),
            languageCode: place.displayName.languageCode,
          }
        : undefined,
      formattedAddress: place.formattedAddress
        ? this.stripUnsafeCharacters(place.formattedAddress)
        : undefined,
      location:
        place.location &&
        typeof place.location.latitude === 'number' &&
        typeof place.location.longitude === 'number'
          ? {
              latitude: Number(place.location.latitude),
              longitude: Number(place.location.longitude),
            }
          : undefined,
      nationalPhoneNumber: place.nationalPhoneNumber
        ? this.stripUnsafeCharacters(place.nationalPhoneNumber)
        : undefined,
      internationalPhoneNumber: place.internationalPhoneNumber
        ? this.stripUnsafeCharacters(place.internationalPhoneNumber)
        : undefined,
      websiteUri:
        place.websiteUri && this.isValidWebUrl(place.websiteUri)
          ? place.websiteUri
          : undefined,
      regularOpeningHours: place.regularOpeningHours
        ? {
            openNow: Boolean(place.regularOpeningHours.openNow),
            weekdayDescriptions: Array.isArray(place.regularOpeningHours.weekdayDescriptions)
              ? place.regularOpeningHours.weekdayDescriptions.map((desc) =>
                  this.stripUnsafeCharacters(desc)
                )
              : undefined,
          }
        : undefined,
      rating: typeof place.rating === 'number' ? place.rating : undefined,
      userRatingCount:
        typeof place.userRatingCount === 'number' ? place.userRatingCount : undefined,
      types: Array.isArray(place.types)
        ? place.types.map((t) => this.stripUnsafeCharacters(t))
        : undefined,
      googleMapsUri:
        place.googleMapsUri && this.isValidWebUrl(place.googleMapsUri)
          ? place.googleMapsUri
          : undefined,
    };
  }

  private stripUnsafeCharacters(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags and content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Strip style tags and content
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control characters
      .trim();
  }

  private isValidWebUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private getCacheKey(options: GooglePlacesSearchOptions): string {
    return `search:${options.latitude?.toFixed(3) ?? 'none'}:${options.longitude?.toFixed(3) ?? 'none'}:${options.radiusKm ?? 10}:${options.query ?? ''}:${options.specialty ?? ''}:${options.limit ?? 20}`;
  }
}

export const googlePlacesService = new GooglePlacesService();
