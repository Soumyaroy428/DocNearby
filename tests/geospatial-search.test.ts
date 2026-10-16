import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidCoordinate,
  calculateHaversineDistanceKm,
  formatDistance,
  getDirectionsUrl,
} from '@/shared/utils/geo';
import { searchQuerySchema } from '@/server/validation/search';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';

describe('CC-04: Maps and Geospatial Search', () => {
  describe('Geospatial Utility Functions', () => {
    it('validates coordinates accurately within statutory boundaries', () => {
      expect(isValidCoordinate(22.5726, 88.3639)).toBe(true);
      expect(isValidCoordinate(-33.8688, 151.2093)).toBe(true); // Sydney
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);

      // Invalid coordinates
      expect(isValidCoordinate(91, 50)).toBe(false);
      expect(isValidCoordinate(-95, 50)).toBe(false);
      expect(isValidCoordinate(22, 185)).toBe(false);
      expect(isValidCoordinate(22, -185)).toBe(false);
      expect(isValidCoordinate('22.5', '88.3')).toBe(false);
      expect(isValidCoordinate(NaN, 88.3)).toBe(false);
      expect(isValidCoordinate(null, undefined)).toBe(false);
    });

    it('calculates Haversine distance with high precision', () => {
      // Park Street (22.5512, 88.3524) to Salt Lake Sector 18 (22.5867, 88.4172) ~ 7.8 km
      const distanceKolkata = calculateHaversineDistanceKm(22.5512, 88.3524, 22.5867, 88.4172);
      expect(distanceKolkata).toBeGreaterThanOrEqual(7.0);
      expect(distanceKolkata).toBeLessThanOrEqual(8.5);

      // Same point distance should be 0
      expect(calculateHaversineDistanceKm(22.5512, 88.3524, 22.5512, 88.3524)).toBe(0);

      // Kolkata to New Delhi (Connaught Place) ~ 1300+ km
      const distanceDelhi = calculateHaversineDistanceKm(22.5512, 88.3524, 28.6315, 77.2167);
      expect(distanceDelhi).toBeGreaterThan(1250);
      expect(distanceDelhi).toBeLessThan(1450);
    });

    it('formats distances cleanly for travelers', () => {
      expect(formatDistance(0.45)).toBe('450 m away');
      expect(formatDistance(0.8)).toBe('800 m away');
      expect(formatDistance(1.23)).toBe('1.2 km away');
      expect(formatDistance(14.8)).toBe('14.8 km away');
      expect(formatDistance(-1)).toBe('');
    });

    it('generates correct Universal Navigation Web Intent URLs', () => {
      const url = getDirectionsUrl(22.5512, 88.3524, 'City Skin Clinic');
      expect(url).toContain('https://www.google.com/maps/dir/?api=1');
      expect(url).toContain('destination=22.5512%2C88.3524');
      expect(url).toContain(encodeURIComponent('City Skin Clinic'));
    });
  });

  describe('Search Query Schema Validation', () => {
    it('accepts valid geospatial parameters and sorting options', () => {
      const parsed = searchQuerySchema.parse({
        latitude: '22.5512',
        longitude: '88.3524',
        radiusKm: '15',
        sortBy: 'distance',
      });

      expect(parsed.latitude).toBe(22.5512);
      expect(parsed.longitude).toBe(88.3524);
      expect(parsed.radiusKm).toBe(15);
      expect(parsed.sortBy).toBe('distance');
    });

    it('rejects coordinates outside latitude [-90, 90] and longitude [-180, 180]', () => {
      expect(() => searchQuerySchema.parse({ latitude: 95, longitude: 88 })).toThrow();
      expect(() => searchQuerySchema.parse({ latitude: -95, longitude: 88 })).toThrow();
      expect(() => searchQuerySchema.parse({ latitude: 22, longitude: 185 })).toThrow();
      expect(() => searchQuerySchema.parse({ latitude: 22, longitude: -185 })).toThrow();
    });

    it('rejects radiusKm exceeding 100km or non-positive', () => {
      expect(() => searchQuerySchema.parse({ radiusKm: 150 })).toThrow();
      expect(() => searchQuerySchema.parse({ radiusKm: 0 })).toThrow();
      expect(() => searchQuerySchema.parse({ radiusKm: -5 })).toThrow();
    });
  });

  describe('Repository Proximity and Radius Search', () => {
    let repo: MemoryProviderRepository;

    beforeEach(() => {
      repo = new MemoryProviderRepository();
    });

    it('attaches distanceKm to providers when coordinates are provided', async () => {
      const userLat = 22.5512; // Park Street, Kolkata
      const userLon = 88.3524;

      const result = await repo.findProviders({
        latitude: userLat,
        longitude: userLon,
        radiusKm: 50,
      });

      expect(result.data.length).toBeGreaterThan(0);
      for (const provider of result.data) {
        expect(provider.distanceKm).toBeDefined();
        expect(typeof provider.distanceKm).toBe('number');
      }
    });

    it('sorts providers by distance (nearest first)', async () => {
      const userLat = 22.5512; // Park Street, Kolkata
      const userLon = 88.3524;

      const result = await repo.findProviders({
        latitude: userLat,
        longitude: userLon,
        radiusKm: 2000, // Large radius including Delhi
        sortBy: 'distance',
      });

      expect(result.data.length).toBeGreaterThan(1);

      // Provider 001 is right at Park Street, so distance should be 0 km
      expect(result.data[0].id).toBe('demo-prov-001');
      expect(result.data[0].distanceKm).toBe(0);

      // Last provider in distance sort should be New Delhi Dental Studio (>1200 km away)
      const lastProvider = result.data[result.data.length - 1];
      expect(lastProvider.id).toBe('demo-prov-005');
      expect(lastProvider.distanceKm).toBeGreaterThan(1000);

      // Verify strictly non-decreasing distance order
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].distanceKm!).toBeGreaterThanOrEqual(result.data[i - 1].distanceKm!);
      }
    });

    it('filters providers strictly within radiusKm', async () => {
      const userLat = 22.5512; // Park Street, Kolkata
      const userLon = 88.3524;

      // Tight radius of 2 km: should only match demo-prov-001 (Park Street)
      const tightResult = await repo.findProviders({
        latitude: userLat,
        longitude: userLon,
        radiusKm: 2,
      });

      expect(tightResult.data.length).toBe(1);
      expect(tightResult.data[0].id).toBe('demo-prov-001');

      // Radius of 15 km: should include all Kolkata providers, but exclude New Delhi
      const cityResult = await repo.findProviders({
        latitude: userLat,
        longitude: userLon,
        radiusKm: 15,
      });

      const delhiProvider = cityResult.data.find((p) => p.id === 'demo-prov-005');
      expect(delhiProvider).toBeUndefined(); // Excluded by 15km radius
      expect(cityResult.data.length).toBe(4); // 4 Kolkata providers within 15km
    });

    it('allows sorting by consultation fee ascending and descending', async () => {
      const feeAsc = await repo.findProviders({
        sortBy: 'fee_asc',
      });

      expect(feeAsc.data.length).toBeGreaterThan(1);
      // Lowest fee should be first (e.g. 50000 or 60000)
      const firstFee = Math.min(...feeAsc.data[0].services.map((s) => s.amountMinor));
      const lastFee = Math.min(...feeAsc.data[feeAsc.data.length - 1].services.map((s) => s.amountMinor));
      expect(firstFee).toBeLessThanOrEqual(lastFee);

      const feeDesc = await repo.findProviders({
        sortBy: 'fee_desc',
      });
      const firstMaxFee = Math.max(...feeDesc.data[0].services.map((s) => s.amountMinor));
      const lastMaxFee = Math.max(...feeDesc.data[feeDesc.data.length - 1].services.map((s) => s.amountMinor));
      expect(firstMaxFee).toBeGreaterThanOrEqual(lastMaxFee);
    });

    it('maintains 100% functionality for manual city search without location permission', async () => {
      const result = await repo.findProviders({
        city: 'New Delhi',
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('demo-prov-005');
      expect(result.data[0].facilities[0].city).toBe('New Delhi');
      // No coordinates provided, so distanceKm is undefined
      expect(result.data[0].distanceKm).toBeUndefined();
    });

    it('strictly preserves private verification record sanitization in geospatial searches', async () => {
      const result = await repo.findProviders({
        latitude: 22.5512,
        longitude: 88.3524,
        radiusKm: 25,
      });

      for (const provider of result.data) {
        expect(provider.privateVerificationRecord).toBeUndefined();
        expect((provider as unknown as Record<string, unknown>).internalNotes).toBeUndefined();
      }
    });
  });
});
