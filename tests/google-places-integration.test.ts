import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GooglePlacesService } from '@/server/services/google-places-service';
import { UnifiedSearchService } from '@/server/services/unified-search-service';
import { unifiedSearchQuerySchema } from '@/server/validation/unified-search';
import { AppointmentService } from '@/server/services/appointment-service';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';
import { MemoryAppointmentRepository } from '@/server/repositories/appointment-repository';
import { NotificationService } from '@/server/services/notification-service';
import { GooglePlaceRaw } from '@/shared/types/discovery';

// Mock sample Google Places response
const MOCK_GOOGLE_PLACE: GooglePlaceRaw = {
  id: 'ChIJ51cu8I-xwokRFZStll0Oi6Q',
  displayName: {
    text: 'City Health Multi-Specialty Clinic',
    languageCode: 'en',
  },
  formattedAddress: '128 Park Street, Park Street area, Kolkata, West Bengal 700016',
  location: {
    latitude: 22.5512,
    longitude: 88.3524,
  },
  nationalPhoneNumber: '+91 33 2229 1000',
  websiteUri: 'https://www.cityhealthclinic.example.com',
  rating: 4.4,
  userRatingCount: 142,
  types: ['medical_clinic', 'health'],
  regularOpeningHours: {
    openNow: true,
    weekdayDescriptions: ['Monday: 8:00 AM – 8:00 PM'],
  },
  googleMapsUri: 'https://maps.google.com/?cid=123456789',
};

describe('Google Maps & Google Places Healthcare Discovery Integration', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let googlePlacesService: GooglePlacesService;
  let providerRepo: MemoryProviderRepository;
  let unifiedSearchService: UnifiedSearchService;

  beforeEach(() => {
    mockFetch = vi.fn();
    googlePlacesService = new GooglePlacesService('test-google-api-key', mockFetch as unknown as typeof fetch);
    providerRepo = new MemoryProviderRepository();
    unifiedSearchService = new UnifiedSearchService(providerRepo, googlePlacesService);
  });

  describe('1. Input & Coordinate Validation', () => {
    it('accepts valid search coordinates and standard radius', () => {
      const parsed = unifiedSearchQuerySchema.parse({
        latitude: '22.5726',
        longitude: '88.3639',
        radiusKm: '15',
        source: 'all',
      });

      expect(parsed.latitude).toBe(22.5726);
      expect(parsed.longitude).toBe(88.3639);
      expect(parsed.radiusKm).toBe(15);
      expect(parsed.source).toBe('all');
    });

    it('rejects out-of-range coordinates', () => {
      expect(() =>
        unifiedSearchQuerySchema.parse({
          latitude: '95.0', // Lat > 90
          longitude: '88.3639',
        })
      ).toThrow();

      expect(() =>
        unifiedSearchQuerySchema.parse({
          latitude: '22.5726',
          longitude: '195.0', // Lon > 180
        })
      ).toThrow();
    });

    it('rejects out-of-range radius (min 0.5km, max 50km)', () => {
      expect(() =>
        unifiedSearchQuerySchema.parse({
          radiusKm: '0.1', // < 0.5
        })
      ).toThrow(/Radius must be at least 0.5 km/);

      expect(() =>
        unifiedSearchQuerySchema.parse({
          radiusKm: '75', // > 50
        })
      ).toThrow(/Radius cannot exceed 50 km/);
    });

    it('enforces bounds on query length', () => {
      const longQuery = 'a'.repeat(120);
      expect(() =>
        unifiedSearchQuerySchema.parse({
          query: longQuery,
        })
      ).toThrow(/Search query cannot exceed 100 characters/);
    });
  });

  describe('2. Google Places Service Adapter', () => {
    it('returns unconfigured status when API key is missing', async () => {
      const unconfiguredService = new GooglePlacesService('', mockFetch as unknown as typeof fetch);
      const res = await unconfiguredService.searchHealthcarePlaces({
        latitude: 22.5726,
        longitude: 88.3639,
      });

      expect(res.status).toBe('unconfigured');
      expect(res.places).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches and normalizes nearby places with modern Places API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const res = await googlePlacesService.searchHealthcarePlaces({
        latitude: 22.5726,
        longitude: 88.3639,
        radiusKm: 10,
      });

      expect(res.status).toBe('ok');
      expect(res.places).toHaveLength(1);
      expect(res.places[0].id).toBe('ChIJ51cu8I-xwokRFZStll0Oi6Q');
      expect(res.places[0].displayName?.text).toBe('City Health Multi-Specialty Clinic');
      expect(res.places[0].location?.latitude).toBe(22.5512);

      // Verify request payload and field mask headers
      expect(mockFetch).toHaveBeenCalledWith(
        'https://places.googleapis.com/v1/places:searchNearby',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Goog-Api-Key': 'test-google-api-key',
            'X-Goog-FieldMask': expect.stringContaining('places.displayName'),
          }),
        })
      );
    });

    it('sanitizes unsafe script and HTML characters from external listings', async () => {
      const unsafePlace: GooglePlaceRaw = {
        id: 'ChIJunsafe123',
        displayName: {
          text: '<script>alert("xss")</script>Safe Clinic Name',
        },
        formattedAddress: '<b>123 Main St</b>',
        location: { latitude: 22.57, longitude: 88.36 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [unsafePlace],
        }),
      });

      const res = await googlePlacesService.searchHealthcarePlaces({
        query: 'safe clinic',
      });

      expect(res.status).toBe('ok');
      expect(res.places[0].displayName?.text).toBe('Safe Clinic Name');
      expect(res.places[0].formattedAddress).toBe('123 Main St');
    });

    it('caches repeated location queries in memory without duplicate network calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      // First query
      const res1 = await googlePlacesService.searchHealthcarePlaces({
        latitude: 22.5726,
        longitude: 88.3639,
        radiusKm: 10,
      });
      expect(res1.status).toBe('ok');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second identical query should hit in-memory cache
      const res2 = await googlePlacesService.searchHealthcarePlaces({
        latitude: 22.5726,
        longitude: 88.3639,
        radiusKm: 10,
      });
      expect(res2.status).toBe('ok');
      expect(res2.places).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1!
    });
  });

  describe('3. Unified Search — Combining Sources & Invariants', () => {
    it('combines DocNearby MongoDB providers and Google Places into unified listings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        radiusKm: 25,
        source: 'all',
        limit: 20,
      });

      expect(response.meta.total).toBeGreaterThan(1);
      expect(response.meta.totalGooglePlaces).toBe(1);
      expect(response.meta.totalDocNearby).toBeGreaterThan(0);
      expect(response.meta.googlePlacesStatus).toBe('ok');
      expect(response.meta.docNearbyStatus).toBe('ok');

      // Verify presence of both sources
      const docNearbyItem = response.data.find((item) => item.source === 'docnearby');
      const googleItem = response.data.find((item) => item.source === 'google_places');

      expect(docNearbyItem).toBeDefined();
      expect(googleItem).toBeDefined();
    });

    it('preserves distinct source-specific identifiers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'all',
      });

      const googleItem = response.data.find((item) => item.source === 'google_places')!;
      const docNearbyItem = response.data.find((item) => item.source === 'docnearby')!;

      expect(googleItem.id).toBe('ChIJ51cu8I-xwokRFZStll0Oi6Q'); // Google Place ID preserved
      expect(googleItem.sourceBadge.label).toBe('Google-listed');
      expect(googleItem.sourceBadge.isDocNearby).toBe(false);

      expect(docNearbyItem.sourceBadge.label).toBe('Registered on DocNearby');
      expect(docNearbyItem.sourceBadge.isDocNearby).toBe(true);
    });

    it('strictly assigns "not_verified_by_docnearby" to external Google Places', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'google_places',
      });

      const googleItem = response.data[0];
      expect(googleItem.verificationStatus).toBe('not_verified_by_docnearby');
      expect(googleItem.verificationBadge.label).toBe('Not verified by DocNearby');
      expect(googleItem.verificationBadge.variant).toBe('external');
    });

    it('strictly assigns statutory verification status to DocNearby providers', async () => {
      const response = await unifiedSearchService.search({
        city: 'Kolkata',
        source: 'docnearby',
      });

      const verifiedDoc = response.data.find((item) => item.id === 'demo-prov-001')!;
      expect(verifiedDoc).toBeDefined();
      expect(verifiedDoc.verificationStatus).toBe('verified');
      expect(verifiedDoc.verificationBadge.label).toBe('Registration verified');
    });

    it('enforces Booking Invariant: Google-only listings cannot be booked directly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'google_places',
      });

      const googleItem = response.data[0];
      expect(googleItem.booking.isAvailable).toBe(false);
      expect(googleItem.booking.providerId).toBeUndefined();
      expect(googleItem.booking.reasonUnavailable).toMatch(/Direct DocNearby appointment booking unavailable/);
    });

    it('enforces Pricing Invariant: Google-only listings display "Fee not verified by DocNearby"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'google_places',
      });

      const googleItem = response.data[0];
      expect(googleItem.pricing.isAvailable).toBe(false);
      expect(googleItem.pricing.amountMinor).toBeUndefined();
      expect(googleItem.pricing.sourceLabel).toBe('Fee not verified by DocNearby');
    });
  });

  describe('4. Server-Side Appointment Guard Against Google Place IDs', () => {
    it('rejects appointment request if providerId is a Google Place ID', async () => {
      const aptRepo = new MemoryAppointmentRepository();
      const notifService = new NotificationService();
      const appointmentService = new AppointmentService(aptRepo, providerRepo, notifService);

      // Attempt to book appointment against a Google Place ID
      await expect(
        appointmentService.createAppointmentRequest('user-traveler-1', {
          providerId: 'ChIJ51cu8I-xwokRFZStll0Oi6Q', // Google Place ID, not a registered provider
          facilityId: 'demo-fac-001',
          serviceId: 'srv-001',
          serviceName: 'Dermatology Consultation',
          patientName: 'Jane Traveler',
          patientEmail: 'jane.traveler@example.com',
          patientPhone: '+91 98765 43210',
          requestedDate: '2026-11-01',
          requestedTimeSlot: '10:00 AM',
        })
      ).rejects.toThrow(/Provider ChIJ51cu8I-xwokRFZStll0Oi6Q not found/);
    });
  });

  describe('5. Fault Isolation & Independent Failure Handling', () => {
    it('returns DocNearby providers safely when Google Places API fails or times out', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Google Places API network timeout'));

      const response = await unifiedSearchService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'all',
      });

      // DocNearby results still succeed!
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.meta.docNearbyStatus).toBe('ok');
      expect(response.meta.googlePlacesStatus).toBe('unavailable');
      expect(response.data.every((item) => item.source === 'docnearby')).toBe(true);
    });

    it('returns Google Places results safely when DocNearby repository query fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [MOCK_GOOGLE_PLACE],
        }),
      });

      // Create a faulty provider repository that throws
      const failingRepo = {
        findProviders: vi.fn().mockRejectedValue(new Error('MongoDB connection severed')),
        getProviderById: vi.fn(),
        createSubmission: vi.fn(),
        getSubmissions: vi.fn(),
        getSubmissionById: vi.fn(),
        updateSubmissionStatus: vi.fn(),
        updateProviderVerification: vi.fn(),
        createPriceReport: vi.fn(),
        getPriceReports: vi.fn(),
        getPriceReportById: vi.fn(),
        resolvePriceReport: vi.fn(),
        getSpecialties: vi.fn(),
        getCities: vi.fn(),
        getLanguages: vi.fn(),
      };

      const failingUnifiedService = new UnifiedSearchService(
        failingRepo as unknown as MemoryProviderRepository,
        googlePlacesService
      );

      const response = await failingUnifiedService.search({
        latitude: 22.5726,
        longitude: 88.3639,
        source: 'all',
      });

      expect(response.data).toHaveLength(1);
      expect(response.data[0].source).toBe('google_places');
      expect(response.meta.docNearbyStatus).toBe('error');
      expect(response.meta.googlePlacesStatus).toBe('ok');
    });
  });
});
