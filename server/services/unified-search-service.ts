/**
 * Unified Healthcare Discovery Service
 * Combines Google Places API healthcare listings with
 * DocNearby-registered MongoDB providers into a normalized,
 * source-attributed response.
 *
 * Preserves CC-05 transparent pricing and CC-06 appointments invariants:
 * - Google-listed places are strictly labeled "Not verified by DocNearby".
 * - Direct DocNearby appointment booking is NEVER available for external Google listings.
 * - Consultation fees are strictly labeled "Fee not verified by DocNearby" for external listings.
 * - Fault isolation: Google Places errors do not break DocNearby MongoDB results, and vice versa.
 */

import {
  UnifiedHealthcareListing,
  UnifiedSearchResponse,
  GooglePlaceRaw,
  DiscoverySource,
  UnifiedSearchParams,
} from '@/shared/types/discovery';
import { ValidatedUnifiedSearchParams, unifiedSearchQuerySchema } from '@/server/validation/unified-search';
import { IProviderRepository, providerRepository as defaultProviderRepo } from '@/server/repositories/provider-repository';
import { GooglePlacesService, googlePlacesService as defaultGooglePlacesService } from '@/server/services/google-places-service';
import { Provider } from '@/shared/types/provider';
import { calculateHaversineDistanceKm, getDirectionsUrl, isValidCoordinate } from '@/shared/utils/geo';
import { checkPriceStaleness } from '@/shared/utils/formatters';

export class UnifiedSearchService {
  constructor(
    private providerRepo: IProviderRepository = defaultProviderRepo,
    private googlePlacesService: GooglePlacesService = defaultGooglePlacesService
  ) {}

  /**
   * Search unified healthcare listings across DocNearby and Google Places
   */
  async search(rawParams: ValidatedUnifiedSearchParams | UnifiedSearchParams): Promise<UnifiedSearchResponse> {
    const params = unifiedSearchQuerySchema.parse(rawParams);
    const shouldFetchDocNearby = params.source === 'all' || params.source === 'docnearby';
    const shouldFetchGoogle = params.source === 'all' || params.source === 'google_places';

    let docNearbyStatus: 'ok' | 'error' = 'ok';
    let googlePlacesStatus: 'ok' | 'unconfigured' | 'unavailable' | 'error' = 'ok';

    // 1. Fetch from DocNearby MongoDB/Memory Repository
    const docNearbyPromise = shouldFetchDocNearby
      ? this.fetchDocNearbyProviders(params)
      : Promise.resolve<Provider[]>([]);

    // 2. Fetch from Google Places API
    const googlePlacesPromise = shouldFetchGoogle
      ? this.fetchGooglePlaces(params)
      : Promise.resolve<{ places: GooglePlaceRaw[]; status: 'ok' | 'unconfigured' | 'unavailable' | 'error' }>({
          places: [],
          status: 'ok',
        });

    // Run in parallel with fault isolation
    const [docNearbySettled, googleSettled] = await Promise.allSettled([
      docNearbyPromise,
      googlePlacesPromise,
    ]);

    let docNearbyProviders: Provider[] = [];
    if (docNearbySettled.status === 'fulfilled') {
      docNearbyProviders = docNearbySettled.value;
    } else {
      docNearbyStatus = 'error';
      docNearbyProviders = [];
    }

    let googlePlaces: GooglePlaceRaw[] = [];
    if (googleSettled.status === 'fulfilled') {
      googlePlaces = googleSettled.value.places;
      googlePlacesStatus = googleSettled.value.status;
    } else {
      googlePlacesStatus = 'error';
      googlePlaces = [];
    }

    // 3. Normalize DocNearby providers
    const normalizedDocNearby = docNearbyProviders.map((provider) =>
      this.normalizeDocNearbyProvider(provider, params)
    );

    // 4. Normalize Google Places listings
    const normalizedGooglePlaces = googlePlaces
      .filter((place) => place.location && isValidCoordinate(place.location.latitude, place.location.longitude))
      .map((place) => this.normalizeGooglePlace(place, params));

    // 5. Combine results and handle distance filtering
    let combined: UnifiedHealthcareListing[] = [...normalizedDocNearby, ...normalizedGooglePlaces];

    // Filter by radius if search coordinates are provided
    if (
      typeof params.latitude === 'number' &&
      typeof params.longitude === 'number' &&
      typeof params.radiusKm === 'number'
    ) {
      combined = combined.filter((item) => {
        if (item.distanceKm === undefined) return true;
        return item.distanceKm <= params.radiusKm!;
      });
    }

    // 6. Sort results
    combined = this.sortListings(combined, params.sortBy || (params.latitude ? 'distance' : 'relevance'));

    // 7. Apply limit
    const total = combined.length;
    const paginated = combined.slice(0, params.limit || 20);

    return {
      data: paginated,
      meta: {
        total,
        totalDocNearby: normalizedDocNearby.length,
        totalGooglePlaces: normalizedGooglePlaces.length,
        googlePlacesStatus,
        docNearbyStatus,
        searchCenter:
          typeof params.latitude === 'number' && typeof params.longitude === 'number'
            ? { latitude: params.latitude, longitude: params.longitude }
            : undefined,
        radiusKm: params.radiusKm,
      },
    };
  }

  /**
   * Normalize a DocNearby registered provider into UnifiedHealthcareListing
   */
  private normalizeDocNearbyProvider(
    provider: Provider,
    params: ValidatedUnifiedSearchParams
  ): UnifiedHealthcareListing {
    const primaryFacility = provider.facilities[0] || {
      id: `${provider.id}-f1`,
      name: provider.displayName,
      address: 'Address on file',
      locality: 'City',
      city: 'Kolkata',
      country: 'India',
    };

    const hasCoords =
      primaryFacility.location?.coordinates &&
      Array.isArray(primaryFacility.location.coordinates) &&
      primaryFacility.location.coordinates.length === 2;

    const lon = hasCoords ? primaryFacility.location!.coordinates[0] : 88.3639;
    const lat = hasCoords ? primaryFacility.location!.coordinates[1] : 22.5726;

    let distanceKm: number | undefined;
    if (
      typeof params.latitude === 'number' &&
      typeof params.longitude === 'number' &&
      isValidCoordinate(lat, lon)
    ) {
      distanceKm = calculateHaversineDistanceKm(params.latitude, params.longitude, lat, lon);
    } else if (provider.distanceKm !== undefined) {
      distanceKm = provider.distanceKm;
    }

    const primaryService = provider.services[0];
    const staleness = primaryService
      ? checkPriceStaleness(primaryService.lastConfirmedAt)
      : null;

    const isVerified = provider.verificationStatus === 'verified';
    const isPending = provider.verificationStatus === 'verification_pending';

    return {
      id: provider.id,
      source: 'docnearby' as DiscoverySource,
      name: provider.displayName,
      facilityName: primaryFacility.name,
      providerType: provider.providerType,
      address: `${primaryFacility.address}, ${primaryFacility.locality}`,
      locality: primaryFacility.locality,
      city: primaryFacility.city,
      location: {
        latitude: lat,
        longitude: lon,
      },
      distanceKm,

      sourceBadge: {
        label: 'Registered on DocNearby',
        isDocNearby: true,
      },

      verificationStatus: isVerified
        ? 'verified'
        : isPending
        ? 'verification_pending'
        : 'unverified',
      verificationBadge: isVerified
        ? {
            label: 'Registration verified',
            variant: 'verified',
            tooltip: 'Statutory medical council registration verified by DocNearby audit',
          }
        : isPending
        ? {
            label: 'Verification pending',
            variant: 'pending',
            tooltip: 'Provider credentials submitted and currently under documentary review',
          }
        : {
            label: 'Unverified Listing',
            variant: 'unverified',
            tooltip: 'Provider registered on DocNearby but statutory credentials not yet verified',
          },

      pricing: {
        isAvailable: Boolean(primaryService),
        amountMinor: primaryService?.amountMinor,
        currency: primaryService?.currency || 'INR',
        priceType: primaryService?.priceType || 'unavailable',
        sourceLabel: primaryService
          ? primaryService.sourceType === 'clinic_verified_fee_schedule'
            ? 'Official Clinic Tariff Schedule'
            : primaryService.sourceType === 'reception_confirmed'
            ? 'Direct Reception Inquiry'
            : 'Provider Declared'
          : 'Fee not specified',
        isStale: staleness?.isStale,
        updatedAt: primaryService?.lastConfirmedAt,
      },

      booking: {
        isAvailable: true,
        providerId: provider.id,
      },

      contact: {
        phone: provider.publicContact.phone || primaryFacility.publicPhone,
        website: provider.publicContact.website,
      },
      directionsUrl: getDirectionsUrl(lat, lon, primaryFacility.name),

      specialties: provider.specialties,
      languages: provider.languages,
      experienceYears: provider.experienceYears,
      registrationReference: provider.registrationReference,
      isDemonstration: provider.isDemonstration,
    };
  }

  /**
   * Normalize an external Google Place into UnifiedHealthcareListing
   */
  private normalizeGooglePlace(
    place: GooglePlaceRaw,
    params: ValidatedUnifiedSearchParams
  ): UnifiedHealthcareListing {
    const lat = place.location!.latitude;
    const lon = place.location!.longitude;

    let distanceKm: number | undefined;
    if (typeof params.latitude === 'number' && typeof params.longitude === 'number') {
      distanceKm = calculateHaversineDistanceKm(params.latitude, params.longitude, lat, lon);
    }

    // Infer provider type from Google Place types
    let providerType: 'doctor' | 'clinic' | 'hospital' | 'diagnostic_center' | 'pharmacy' = 'clinic';
    if (place.types?.includes('hospital')) {
      providerType = 'hospital';
    } else if (place.types?.includes('pharmacy') || place.types?.includes('drugstore')) {
      providerType = 'pharmacy';
    } else if (place.types?.includes('medical_lab')) {
      providerType = 'diagnostic_center';
    } else if (
      place.types?.includes('doctor') ||
      place.types?.includes('dentist') ||
      place.types?.includes('physiotherapist')
    ) {
      providerType = 'doctor';
    } else if (
      place.types?.includes('medical_clinic') ||
      place.types?.includes('dental_clinic')
    ) {
      providerType = 'clinic';
    }

    const name = place.displayName?.text || 'Healthcare Facility';

    return {
      id: place.id, // Source-specific Google Place ID
      source: 'google_places' as DiscoverySource,
      name,
      facilityName: name,
      providerType,
      address: place.formattedAddress || 'Address unavailable',
      location: {
        latitude: lat,
        longitude: lon,
      },
      distanceKm,

      // Source branding
      sourceBadge: {
        label: 'Google-listed',
        isDocNearby: false,
      },

      // Statutory verification: ALWAYS unverified by DocNearby
      verificationStatus: 'not_verified_by_docnearby',
      verificationBadge: {
        label: 'Not verified by DocNearby',
        variant: 'external',
        tooltip:
          'Discovered through Google Places public registry. Medical credentials, fees, and clinical quality have not been audited by DocNearby.',
      },

      // Pricing: NEVER fabricated or assumed
      pricing: {
        isAvailable: false,
        currency: 'INR',
        sourceLabel: 'Fee not verified by DocNearby',
      },

      // Booking: STRICT INVARIANT - External Google listings cannot be booked directly
      booking: {
        isAvailable: false,
        reasonUnavailable:
          'Direct DocNearby appointment booking unavailable for external Google listing.',
      },

      contact: {
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
        website: place.websiteUri,
      },
      directionsUrl: place.googleMapsUri || getDirectionsUrl(lat, lon, name),

      rating: place.rating,
      userRatingCount: place.userRatingCount,
      openNow: place.regularOpeningHours?.openNow,
      openingHours: place.regularOpeningHours?.weekdayDescriptions,
      types: place.types,
      primaryTypeLabel: place.primaryTypeDisplayName?.text,
      accessibility: {
        wheelchairAccessible: Boolean(
          place.accessibilityOptions?.wheelchairAccessibleEntrance ||
          place.accessibilityOptions?.wheelchairAccessibleParking ||
          place.accessibilityOptions?.wheelchairAccessibleRestroom
        ),
        wheelchairParking: place.accessibilityOptions?.wheelchairAccessibleParking,
        wheelchairEntrance: place.accessibilityOptions?.wheelchairAccessibleEntrance,
        wheelchairRestroom: place.accessibilityOptions?.wheelchairAccessibleRestroom,
      },
    };
  }

  private async fetchDocNearbyProviders(params: ValidatedUnifiedSearchParams): Promise<Provider[]> {
    const filterParams: Record<string, unknown> = {
      limit: 50,
    };

    if (params.city) filterParams.city = params.city;
    if (params.specialty) filterParams.specialty = params.specialty;
    if (params.query) filterParams.query = params.query;
    if (typeof params.latitude === 'number' && typeof params.longitude === 'number') {
      filterParams.latitude = params.latitude;
      filterParams.longitude = params.longitude;
      filterParams.radiusKm = params.radiusKm || 10;
      filterParams.sortBy = 'distance';
    }

    const result = await this.providerRepo.findProviders(filterParams);
    return result.data;
  }

  private async fetchGooglePlaces(
    params: ValidatedUnifiedSearchParams
  ): Promise<{ places: GooglePlaceRaw[]; status: 'ok' | 'unconfigured' | 'unavailable' | 'error' }> {
    const searchOptions = {
      latitude: params.latitude,
      longitude: params.longitude,
      radiusKm: params.radiusKm || 10,
      query: params.query,
      specialty: params.specialty,
      city: params.city,
      limit: params.limit || 20,
    };

    const res = await this.googlePlacesService.searchHealthcarePlaces(searchOptions);
    return {
      places: res.places,
      status: res.status,
    };
  }

  private sortListings(
    listings: UnifiedHealthcareListing[],
    sortBy: 'distance' | 'relevance' | 'rating'
  ): UnifiedHealthcareListing[] {
    return [...listings].sort((a, b) => {
      if (sortBy === 'distance') {
        const distA = a.distanceKm ?? Infinity;
        const distB = b.distanceKm ?? Infinity;
        return distA - distB;
      }

      if (sortBy === 'rating') {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      }

      // Default: relevance
      // 1. DocNearby verified providers first
      const aIsDocNearbyVerified = a.source === 'docnearby' && a.verificationStatus === 'verified';
      const bIsDocNearbyVerified = b.source === 'docnearby' && b.verificationStatus === 'verified';
      if (aIsDocNearbyVerified && !bIsDocNearbyVerified) return -1;
      if (!aIsDocNearbyVerified && bIsDocNearbyVerified) return 1;

      // 2. Nearest distance
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }

      return 0;
    });
  }
}

export const unifiedSearchService = new UnifiedSearchService();
