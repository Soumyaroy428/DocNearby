import { Provider, SearchFilters, PaginatedResult } from '@/shared/types/provider';
import { DEMO_PROVIDERS } from '@/server/data/mock-providers';

export interface IProviderRepository {
  findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>>;
  getProviderById(id: string): Promise<Provider | null>;
  getSpecialties(): Promise<string[]>;
  getCities(): Promise<string[]>;
  getLanguages(): Promise<string[]>;
}

export class MemoryProviderRepository implements IProviderRepository {
  private providers: Provider[] = [...DEMO_PROVIDERS];

  async findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>> {
    let filtered = [...this.providers];

    // Filter by city
    if (filters.city && filters.city.trim() !== '') {
      const cityQuery = filters.city.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.facilities.some(f =>
          f.city.toLowerCase().includes(cityQuery) ||
          f.locality.toLowerCase().includes(cityQuery)
        )
      );
    }

    // Filter by locality
    if (filters.locality && filters.locality.trim() !== '') {
      const localityQuery = filters.locality.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.facilities.some(f => f.locality.toLowerCase().includes(localityQuery))
      );
    }

    // Filter by specialty
    if (filters.specialty && filters.specialty.trim() !== '') {
      const specQuery = filters.specialty.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.specialties.some(s => s.toLowerCase().includes(specQuery))
      );
    }

    // Filter by language
    if (filters.language && filters.language.trim() !== '') {
      const langQuery = filters.language.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.languages.some(l => l.toLowerCase() === langQuery || l.toLowerCase().includes(langQuery))
      );
    }

    // Filter by max fee in integer minor units (paise)
    if (typeof filters.maxFeeMinor === 'number' && filters.maxFeeMinor >= 0) {
      const maxFee = filters.maxFeeMinor;
      filtered = filtered.filter(p =>
        p.services.some(s => s.amountMinor <= maxFee)
      );
    }

    // Filter by provider type
    if (filters.providerType) {
      filtered = filtered.filter(p => p.providerType === filters.providerType);
    }

    // Filter by verification status
    if (filters.verificationStatus) {
      filtered = filtered.filter(p => p.verificationStatus === filters.verificationStatus);
    }

    // Free text query
    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.trim().toLowerCase();
      filtered = filtered.filter(p =>
        p.displayName.toLowerCase().includes(q) ||
        p.specialties.some(s => s.toLowerCase().includes(q)) ||
        p.facilities.some(f =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q) ||
          f.locality.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q)
        )
      );
    }

    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 10));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getProviderById(id: string): Promise<Provider | null> {
    const provider = this.providers.find(p => p.id === id);
    return provider ? { ...provider } : null;
  }

  async getSpecialties(): Promise<string[]> {
    const specialtiesSet = new Set<string>();
    this.providers.forEach(p => p.specialties.forEach(s => specialtiesSet.add(s)));
    return Array.from(specialtiesSet).sort();
  }

  async getCities(): Promise<string[]> {
    const citiesSet = new Set<string>();
    this.providers.forEach(p => p.facilities.forEach(f => citiesSet.add(f.city)));
    return Array.from(citiesSet).sort();
  }

  async getLanguages(): Promise<string[]> {
    const languagesSet = new Set<string>();
    this.providers.forEach(p => p.languages.forEach(l => languagesSet.add(l)));
    return Array.from(languagesSet).sort();
  }
}

export const providerRepository = new MemoryProviderRepository();
