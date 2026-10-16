import { IProviderRepository, providerRepository } from '@/lib/repositories/provider-repository';
import { searchQuerySchema, ValidatedSearchQuery } from '@/lib/validation/search';
import { Provider, PaginatedResult } from '@/lib/types/provider';

export class ProviderService {
  constructor(private repo: IProviderRepository = providerRepository) {}

  async searchProviders(params: Record<string, unknown>): Promise<PaginatedResult<Provider>> {
    const validated = searchQuerySchema.parse(params);
    return this.repo.findProviders(validated);
  }

  async getProviderById(id: string): Promise<Provider | null> {
    if (!id || typeof id !== 'string') return null;
    return this.repo.getProviderById(id);
  }

  async getSearchMetadata(): Promise<{
    specialties: string[];
    cities: string[];
    languages: string[];
  }> {
    const [specialties, cities, languages] = await Promise.all([
      this.repo.getSpecialties(),
      this.repo.getCities(),
      this.repo.getLanguages(),
    ]);

    return { specialties, cities, languages };
  }
}

export const providerService = new ProviderService();

