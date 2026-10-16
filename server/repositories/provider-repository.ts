import {
  Provider,
  SearchFilters,
  PaginatedResult,
  ProviderSubmission,
  SubmissionStatus,
} from '@/shared/types/provider';
import { DEMO_PROVIDERS } from '@/server/data/mock-providers';

export interface IProviderRepository {
  findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>>;
  getProviderById(id: string, includePrivate?: boolean): Promise<Provider | null>;
  createProvider(providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider>;
  updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | null>;
  createSubmission(
    submission: Omit<ProviderSubmission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProviderSubmission>;
  getSubmissions(status?: SubmissionStatus): Promise<ProviderSubmission[]>;
  getSubmissionById(id: string): Promise<ProviderSubmission | null>;
  updateSubmission(id: string, updates: Partial<ProviderSubmission>): Promise<ProviderSubmission | null>;
  getSpecialties(): Promise<string[]>;
  getCities(): Promise<string[]>;
  getLanguages(): Promise<string[]>;
}

export class MemoryProviderRepository implements IProviderRepository {
  private providers: Provider[];
  private submissions: ProviderSubmission[];

  constructor() {
    // Initialize providers with deep copy to avoid mutation across tests
    this.providers = JSON.parse(JSON.stringify(DEMO_PROVIDERS));

    // Seed mock submissions for testing & verification
    this.submissions = [
      {
        id: 'sub-001',
        submittedByUserId: 'user-provider-001',
        applicantName: 'Dr. Debashis Sen',
        applicantEmail: 'debashis.sen@example.com',
        applicantRole: 'Consultant Orthopedic Surgeon',
        displayName: 'Dr. Debashis Sen Ortho Clinic',
        providerType: 'doctor',
        specialties: ['Orthopedics', 'Joint Replacement'],
        languages: ['English', 'Bengali', 'Hindi'],
        qualifications: ['MBBS', 'MS (Orthopedics)'],
        experienceYears: 14,
        registrationReference: 'WBMC-REG-2010-4829',
        authorityName: 'West Bengal Medical Council',
        documentStorageRef: 'SECURE-VAULT/DOCS/WBMC-4829-CERT.pdf',
        locality: 'Salt Lake',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        consultationFeeMinor: 90000,
        publicPhone: '+91 33 2345 6789',
        publicEmail: 'contact@senortho.example.com',
        status: 'pending_review',
        createdAt: '2026-10-10T11:00:00Z',
        updatedAt: '2026-10-10T11:00:00Z',
      },
      {
        id: 'sub-002',
        submittedByUserId: 'user-provider-002',
        applicantName: 'Dr. Rajesh Sharma',
        applicantEmail: 'provider@example.com',
        applicantRole: 'Physician',
        displayName: 'Demo Dr. Rajesh Sharma',
        providerType: 'doctor',
        specialties: ['General Medicine'],
        languages: ['English', 'Hindi'],
        qualifications: ['MBBS', 'DNB'],
        experienceYears: 8,
        registrationReference: 'DMC-REG-2016-DEMO',
        authorityName: 'Delhi Medical Council',
        locality: 'Salt Lake',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: 60000,
        publicPhone: '+91 33 2222 0002',
        status: 'approved',
        createdProviderId: 'demo-prov-002',
        reviewNotes: 'Delhi Medical Council registry verified. Good standing confirmed.',
        reviewedBy: 'user-admin-001',
        reviewedAt: '2026-08-15T12:00:00Z',
        createdAt: '2026-08-10T10:00:00Z',
        updatedAt: '2026-08-15T12:00:00Z',
      },
    ];
  }

  async findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>> {
    let filtered = [...this.providers];

    // Filter by city
    if (filters.city && filters.city.trim() !== '') {
      const cityQuery = filters.city.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.facilities.some(
          (f) =>
            f.city.toLowerCase().includes(cityQuery) ||
            f.locality.toLowerCase().includes(cityQuery)
        )
      );
    }

    // Filter by locality
    if (filters.locality && filters.locality.trim() !== '') {
      const localityQuery = filters.locality.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.facilities.some((f) => f.locality.toLowerCase().includes(localityQuery))
      );
    }

    // Filter by specialty
    if (filters.specialty && filters.specialty.trim() !== '') {
      const specQuery = filters.specialty.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.specialties.some((s) => s.toLowerCase().includes(specQuery))
      );
    }

    // Filter by language
    if (filters.language && filters.language.trim() !== '') {
      const langQuery = filters.language.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.languages.some(
          (l) => l.toLowerCase() === langQuery || l.toLowerCase().includes(langQuery)
        )
      );
    }

    // Filter by max fee in integer minor units (paise)
    if (typeof filters.maxFeeMinor === 'number' && filters.maxFeeMinor >= 0) {
      const maxFee = filters.maxFeeMinor;
      filtered = filtered.filter((p) =>
        p.services.some((s) => s.amountMinor <= maxFee)
      );
    }

    // Filter by provider type
    if (filters.providerType) {
      filtered = filtered.filter((p) => p.providerType === filters.providerType);
    }

    // Filter by verification status
    if (filters.verificationStatus) {
      filtered = filtered.filter((p) => p.verificationStatus === filters.verificationStatus);
    }

    // Free text query
    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.specialties.some((s) => s.toLowerCase().includes(q)) ||
          p.facilities.some(
            (f) =>
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

    // Public protection: Ensure privateVerificationRecord is completely stripped in public search
    const sanitizedData = paginatedItems.map((p) => {
      const copy = { ...p };
      delete copy.privateVerificationRecord;
      return copy;
    });

    return {
      data: sanitizedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getProviderById(id: string, includePrivate = false): Promise<Provider | null> {
    const provider = this.providers.find((p) => p.id === id);
    if (!provider) return null;

    const copy = { ...provider };
    if (!includePrivate) {
      delete copy.privateVerificationRecord;
    }
    return copy;
  }

  async createProvider(
    providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Provider> {
    const id = `prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProvider: Provider = {
      ...providerData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.providers.push(newProvider);
    return { ...newProvider };
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | null> {
    const index = this.providers.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.providers[index] = {
      ...this.providers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.providers[index] };
  }

  async createSubmission(
    submission: Omit<ProviderSubmission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProviderSubmission> {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newSub: ProviderSubmission = {
      ...submission,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.submissions.push(newSub);
    return { ...newSub };
  }

  async getSubmissions(status?: SubmissionStatus): Promise<ProviderSubmission[]> {
    if (status) {
      return this.submissions
        .filter((s) => s.status === status)
        .map((s) => ({ ...s }));
    }
    return this.submissions.map((s) => ({ ...s }));
  }

  async getSubmissionById(id: string): Promise<ProviderSubmission | null> {
    const sub = this.submissions.find((s) => s.id === id);
    return sub ? { ...sub } : null;
  }

  async updateSubmission(
    id: string,
    updates: Partial<ProviderSubmission>
  ): Promise<ProviderSubmission | null> {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) return null;

    this.submissions[index] = {
      ...this.submissions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.submissions[index] };
  }

  async getSpecialties(): Promise<string[]> {
    const specialtiesSet = new Set<string>();
    this.providers.forEach((p) => p.specialties.forEach((s) => specialtiesSet.add(s)));
    return Array.from(specialtiesSet).sort();
  }

  async getCities(): Promise<string[]> {
    const citiesSet = new Set<string>();
    this.providers.forEach((p) => p.facilities.forEach((f) => citiesSet.add(f.city)));
    return Array.from(citiesSet).sort();
  }

  async getLanguages(): Promise<string[]> {
    const languagesSet = new Set<string>();
    this.providers.forEach((p) => p.languages.forEach((l) => languagesSet.add(l)));
    return Array.from(languagesSet).sort();
  }
}

export const providerRepository = new MemoryProviderRepository();
