import { describe, it, expect } from 'vitest';
import { ProviderService } from '@/lib/services/provider-service';
import { MemoryProviderRepository } from '@/lib/repositories/provider-repository';
import { ZodError } from 'zod';

describe('ProviderService & Search Filtering', () => {
  const repo = new MemoryProviderRepository();
  const service = new ProviderService(repo);

  it('retrieves all demo providers without filters', async () => {
    const result = await service.searchProviders({});
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta.total).toBeGreaterThan(0);
    expect(result.data.every((p) => p.isDemonstration)).toBe(true);
  });

  it('filters providers by city (e.g., Kolkata)', async () => {
    const result = await service.searchProviders({ city: 'Kolkata' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((p) =>
        p.facilities.some(
          (f) => f.city.toLowerCase() === 'kolkata' || f.locality.toLowerCase().includes('kolkata')
        )
      )
    ).toBe(true);
  });

  it('filters providers by specialty (e.g., Dermatology)', async () => {
    const result = await service.searchProviders({ specialty: 'Dermatology' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((p) =>
        p.specialties.some((s) => s.toLowerCase().includes('dermatology'))
      )
    ).toBe(true);
  });

  it('filters providers by language (e.g., Bengali)', async () => {
    const result = await service.searchProviders({ language: 'Bengali' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((p) =>
        p.languages.some((l) => l.toLowerCase() === 'bengali')
      )
    ).toBe(true);
  });

  it('filters providers by maximum consultation fee (maxFeeMinor)', async () => {
    // ₹800 = 80,000 paise
    const result = await service.searchProviders({ maxFeeMinor: 80000 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((p) =>
        p.services.some((s) => s.amountMinor <= 80000)
      )
    ).toBe(true);
  });

  it('combines city, specialty, language, and fee filters accurately', async () => {
    // English-speaking dermatologist in Kolkata under ₹1,000 (100,000 paise)
    const result = await service.searchProviders({
      city: 'Kolkata',
      specialty: 'Dermatology',
      language: 'English',
      maxFeeMinor: 100000,
    });

    expect(result.data.length).toBe(1);
    const provider = result.data[0];
    expect(provider.displayName).toContain('Ananya Mukherjee');
    expect(provider.verificationStatus).toBe('verified');
  });

  it('returns empty result cleanly for non-matching criteria without error', async () => {
    const result = await service.searchProviders({
      city: 'NonExistentCityXYZ',
    });
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('retrieves provider by ID when it exists', async () => {
    const provider = await service.getProviderById('demo-prov-001');
    expect(provider).not.toBeNull();
    expect(provider?.id).toBe('demo-prov-001');
    expect(provider?.verificationStatus).toBe('verified');
  });

  it('returns null for non-existent provider ID', async () => {
    const provider = await service.getProviderById('unknown-id-999');
    expect(provider).toBeNull();
  });

  it('rejects invalid negative maxFeeMinor parameter', async () => {
    await expect(
      service.searchProviders({ maxFeeMinor: -500 })
    ).rejects.toThrow(ZodError);
  });

  it('respects bounded pagination limits', async () => {
    const result = await service.searchProviders({ page: 1, limit: 2 });
    expect(result.data.length).toBeLessThanOrEqual(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(2);
  });
});

