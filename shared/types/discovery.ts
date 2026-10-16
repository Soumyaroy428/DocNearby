/**
 * DocNearby Unified Healthcare Discovery Types
 * Standardized data model combining Google Places listings with
 * DocNearby-registered MongoDB healthcare providers.
 */

export type DiscoverySource = 'docnearby' | 'google_places';

export type UnifiedVerificationStatus =
  | 'verified'
  | 'verification_pending'
  | 'unverified'
  | 'not_verified_by_docnearby';

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

export interface GooglePlaceRaw {
  id: string; // Google Place ID (e.g., 'ChIJN1t_tDeuEmsRUsoyG83frY4')
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  location?: GooglePlaceLocation;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
}

export interface UnifiedHealthcareListing {
  id: string; // Source-specific ID: DocNearby provider ID or Google Place ID
  source: DiscoverySource;
  name: string;
  facilityName?: string;
  providerType: 'doctor' | 'clinic' | 'hospital' | 'diagnostic_center' | 'pharmacy';
  address: string;
  locality?: string;
  city?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceKm?: number;

  // Source attribution & branding
  sourceBadge: {
    label: 'Registered on DocNearby' | 'Google-listed';
    isDocNearby: boolean;
  };

  // Statutory medical verification status
  verificationStatus: UnifiedVerificationStatus;
  verificationBadge: {
    label: string;
    variant: 'verified' | 'pending' | 'unverified' | 'external';
    tooltip: string;
  };

  // CC-05 Transparent Pricing
  pricing: {
    isAvailable: boolean;
    amountMinor?: number; // In paise for INR
    currency: string;
    priceType?: string;
    sourceLabel: string;
    isStale?: boolean;
    updatedAt?: string;
  };

  // CC-06 Appointments & Booking
  booking: {
    isAvailable: boolean; // TRUE strictly for confirmed, eligible DocNearby providers
    providerId?: string; // Present ONLY for DocNearby providers
    reasonUnavailable?: string; // Reason if booking unavailable
  };

  // Contact & External Navigation
  contact: {
    phone?: string;
    website?: string;
  };
  directionsUrl: string;

  // Google Places specific metadata
  rating?: number;
  userRatingCount?: number;
  openingHours?: string[];
  openNow?: boolean;

  // DocNearby specific metadata
  specialties?: string[];
  languages?: string[];
  experienceYears?: number;
  registrationReference?: string;
  isDemonstration?: boolean;
}

export interface UnifiedSearchParams {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  query?: string;
  specialty?: string;
  city?: string;
  source?: 'all' | 'docnearby' | 'google_places';
  sortBy?: 'distance' | 'relevance' | 'rating';
  limit?: number;
}

export interface UnifiedSearchMeta {
  total: number;
  totalDocNearby: number;
  totalGooglePlaces: number;
  googlePlacesStatus: 'ok' | 'unconfigured' | 'unavailable' | 'error';
  docNearbyStatus: 'ok' | 'error';
  searchCenter?: {
    latitude: number;
    longitude: number;
  };
  radiusKm?: number;
}

export interface UnifiedSearchResponse {
  data: UnifiedHealthcareListing[];
  meta: UnifiedSearchMeta;
}

