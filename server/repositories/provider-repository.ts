import {
  Provider,
  SearchFilters,
  PaginatedResult,
  ProviderSubmission,
  SubmissionStatus,
  PriceCorrectionReport,
  PriceCorrectionStatus,
  ServicePrice,
} from '@/shared/types/provider';
import { DEMO_PROVIDERS } from '@/server/data/mock-providers';
import { getMongoDb, isMongoConfigured } from '@/server/db/mongodb';
import { calculateHaversineDistanceKm } from '@/shared/utils/geo';

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
  createPriceReport(
    report: Omit<PriceCorrectionReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PriceCorrectionReport>;
  getPriceReports(status?: PriceCorrectionStatus): Promise<PriceCorrectionReport[]>;
  getPriceReportById(id: string): Promise<PriceCorrectionReport | null>;
  resolvePriceReport(
    reportId: string,
    action: {
      decision: 'accepted' | 'dismissed';
      reviewNotes: string;
      reviewedByUserId: string;
      updateProviderPrice?: boolean;
    }
  ): Promise<PriceCorrectionReport | null>;
  updateServicePrice(
    providerId: string,
    serviceId: string,
    updates: Partial<ServicePrice>
  ): Promise<Provider | null>;
  getSpecialties(): Promise<string[]>;
  getCities(): Promise<string[]>;
  getLanguages(): Promise<string[]>;
}

export class MemoryProviderRepository implements IProviderRepository {
  private providers: Provider[];
  private submissions: ProviderSubmission[];
  private priceReports: PriceCorrectionReport[];

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

    // Seed initial demonstration price correction report
    this.priceReports = [
      {
        id: 'prep-001',
        providerId: 'demo-prov-003',
        providerName: 'Demo Bengal Heart & Diagnostic Center',
        serviceId: 'demo-srv-004',
        serviceName: 'Cardiology Specialist Consultation',
        listedAmountMinor: 120000,
        reportedAmountMinor: 140000,
        currency: 'INR',
        observedDate: '2026-10-14',
        evidenceOrReceiptNotes: 'Senior consultant fee was revised from ₹1,200 to ₹1,400 effective October 1st as confirmed on reception billing receipt.',
        reporterEmail: 'traveler@example.com',
        status: 'pending_review',
        createdAt: '2026-10-15T09:30:00Z',
        updatedAt: '2026-10-15T09:30:00Z',
      },
    ];
  }

  async findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>> {
    let filtered = [...this.providers];

    // Filter by city
    if (filters.city && filters.city.trim() !== '') {
      const cityQuery = filters.city.split(',')[0].trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.facilities.some(
          (f) =>
            f.city.toLowerCase().includes(cityQuery) ||
            cityQuery.includes(f.city.toLowerCase()) ||
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

    // CC-04: Geospatial Calculation & Radius Filter
    if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
      const uLat = filters.latitude;
      const uLon = filters.longitude;

      filtered = filtered.map((p) => {
        let minDistanceKm: number | undefined = undefined;
        for (const fac of p.facilities) {
          if (
            fac.location?.coordinates &&
            Array.isArray(fac.location.coordinates) &&
            fac.location.coordinates.length === 2
          ) {
            const [lon, lat] = fac.location.coordinates;
            const dist = calculateHaversineDistanceKm(uLat, uLon, lat, lon);
            if (minDistanceKm === undefined || dist < minDistanceKm) {
              minDistanceKm = dist;
            }
          }
        }
        return {
          ...p,
          distanceKm: minDistanceKm,
        };
      });

      // Filter by radius if provided
      if (typeof filters.radiusKm === 'number' && filters.radiusKm > 0) {
        const radius = filters.radiusKm;
        filtered = filtered.filter(
          (p) => p.distanceKm !== undefined && p.distanceKm <= radius
        );
      }
    }

    // CC-04: Sorting (distance, fee_asc, fee_desc, relevance)
    const sortBy =
      filters.sortBy ||
      (typeof filters.latitude === 'number' && typeof filters.longitude === 'number'
        ? 'distance'
        : 'relevance');

    if (sortBy === 'distance') {
      filtered.sort((a, b) => {
        const distA = a.distanceKm !== undefined ? a.distanceKm : Infinity;
        const distB = b.distanceKm !== undefined ? b.distanceKm : Infinity;
        return distA - distB;
      });
    } else if (sortBy === 'fee_asc') {
      filtered.sort((a, b) => {
        const feeA = a.services.length > 0 ? Math.min(...a.services.map((s) => s.amountMinor)) : Infinity;
        const feeB = b.services.length > 0 ? Math.min(...b.services.map((s) => s.amountMinor)) : Infinity;
        return feeA - feeB;
      });
    } else if (sortBy === 'fee_desc') {
      filtered.sort((a, b) => {
        const feeA = a.services.length > 0 ? Math.max(...a.services.map((s) => s.amountMinor)) : -Infinity;
        const feeB = b.services.length > 0 ? Math.max(...b.services.map((s) => s.amountMinor)) : -Infinity;
        return feeB - feeA;
      });
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

  // --- CC-05: Price Correction Reports & Updates ---

  async createPriceReport(
    report: Omit<PriceCorrectionReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PriceCorrectionReport> {
    const id = `prep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newReport: PriceCorrectionReport = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.priceReports.push(newReport);
    return { ...newReport };
  }

  async getPriceReports(status?: PriceCorrectionStatus): Promise<PriceCorrectionReport[]> {
    if (status) {
      return this.priceReports
        .filter((r) => r.status === status)
        .map((r) => ({ ...r }));
    }
    return this.priceReports.map((r) => ({ ...r }));
  }

  async getPriceReportById(id: string): Promise<PriceCorrectionReport | null> {
    const report = this.priceReports.find((r) => r.id === id);
    return report ? { ...report } : null;
  }

  async resolvePriceReport(
    reportId: string,
    action: {
      decision: 'accepted' | 'dismissed';
      reviewNotes: string;
      reviewedByUserId: string;
      updateProviderPrice?: boolean;
    }
  ): Promise<PriceCorrectionReport | null> {
    const index = this.priceReports.findIndex((r) => r.id === reportId);
    if (index === -1) return null;

    const now = new Date().toISOString();
    this.priceReports[index] = {
      ...this.priceReports[index],
      status: action.decision,
      reviewNotes: action.reviewNotes,
      reviewedByUserId: action.reviewedByUserId,
      reviewedAt: now,
      updatedAt: now,
    };

    const resolved = { ...this.priceReports[index] };

    // If accepted and updateProviderPrice is true, update the provider's corresponding service
    if (action.decision === 'accepted' && action.updateProviderPrice) {
      const provider = this.providers.find((p) => p.id === resolved.providerId);
      if (provider) {
        const sIndex = provider.services.findIndex(
          (s) =>
            (resolved.serviceId && s.id === resolved.serviceId) ||
            s.serviceName.toLowerCase() === resolved.serviceName?.toLowerCase()
        );

        if (sIndex !== -1) {
          provider.services[sIndex] = {
            ...provider.services[sIndex],
            amountMinor: resolved.reportedAmountMinor,
            lastConfirmedAt: now,
            sourceType: 'patient_reported_community',
            notes: `Updated via verified patient price report: ${resolved.evidenceOrReceiptNotes}`,
          };
          provider.updatedAt = now;
        }
      }
    }

    return resolved;
  }

  async updateServicePrice(
    providerId: string,
    serviceId: string,
    updates: Partial<ServicePrice>
  ): Promise<Provider | null> {
    const pIndex = this.providers.findIndex((p) => p.id === providerId);
    if (pIndex === -1) return null;

    const sIndex = this.providers[pIndex].services.findIndex((s) => s.id === serviceId);
    if (sIndex === -1) return null;

    const now = new Date().toISOString();
    this.providers[pIndex].services[sIndex] = {
      ...this.providers[pIndex].services[sIndex],
      ...updates,
      lastConfirmedAt: updates.lastConfirmedAt || now,
    };
    this.providers[pIndex].updatedAt = now;

    return { ...this.providers[pIndex] };
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

/**
 * MongoDB Atlas persistent provider repository with fallback.
 */
export class MongoProviderRepository implements IProviderRepository {
  private fallback = new MemoryProviderRepository();
  private hasInitialized = false;

  private async getDb() {
    if (!isMongoConfigured()) return null;
    try {
      const db = await getMongoDb();
      if (!this.hasInitialized) {
        this.hasInitialized = true;
        // Seed default providers if collection is empty
        const count = await db.collection('providers').countDocuments().catch(() => 0);
        if (count === 0) {
          await db.collection('providers').insertMany(DEMO_PROVIDERS).catch(() => {});
        }
      }
      return db;
    } catch {
      return null;
    }
  }

  async findProviders(filters: SearchFilters): Promise<PaginatedResult<Provider>> {
    const db = await this.getDb();
    if (!db) return this.fallback.findProviders(filters);

    try {
      const query: Record<string, unknown> = {};

      if (filters.city && filters.city.trim() !== '') {
        const cityRegex = new RegExp(filters.city.trim(), 'i');
        query.$or = [
          { 'facilities.city': cityRegex },
          { 'facilities.locality': cityRegex },
        ];
      }

      if (filters.locality && filters.locality.trim() !== '') {
        query['facilities.locality'] = new RegExp(filters.locality.trim(), 'i');
      }

      if (filters.specialty && filters.specialty.trim() !== '') {
        query.specialties = new RegExp(filters.specialty.trim(), 'i');
      }

      if (filters.language && filters.language.trim() !== '') {
        query.languages = new RegExp(filters.language.trim(), 'i');
      }

      if (typeof filters.maxFeeMinor === 'number' && filters.maxFeeMinor >= 0) {
        query['services.amountMinor'] = { $lte: filters.maxFeeMinor };
      }

      if (filters.providerType) {
        query.providerType = filters.providerType;
      }

      if (filters.verificationStatus) {
        query.verificationStatus = filters.verificationStatus;
      }

      if (filters.query && filters.query.trim() !== '') {
        const qRegex = new RegExp(filters.query.trim(), 'i');
        query.$or = [
          { displayName: qRegex },
          { specialties: qRegex },
          { 'facilities.name': qRegex },
          { 'facilities.locality': qRegex },
          { 'facilities.city': qRegex },
        ];
      }

      // CC-04: Geospatial Query Filter
      if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
        const radiusKm = filters.radiusKm || 10;
        const radiusInRadians = radiusKm / 6378.1;
        query['facilities.location'] = {
          $geoWithin: {
            $centerSphere: [[filters.longitude, filters.latitude], radiusInRadians],
          },
        };
      }

      const page = Math.max(1, filters.page || 1);
      const limit = Math.min(50, Math.max(1, filters.limit || 10));
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        db.collection<Provider>('providers')
          .find(query, { projection: { privateVerificationRecord: 0 } })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('providers').countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      let sanitizedData = items.map((p: Provider) => {
        const sanitized = { ...p };
        delete sanitized.privateVerificationRecord;
        if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
          let minDist: number | undefined = undefined;
          for (const fac of p.facilities) {
            if (
              fac.location?.coordinates &&
              Array.isArray(fac.location.coordinates) &&
              fac.location.coordinates.length === 2
            ) {
              const [lon, lat] = fac.location.coordinates;
              const d = calculateHaversineDistanceKm(filters.latitude, filters.longitude, lat, lon);
              if (minDist === undefined || d < minDist) minDist = d;
            }
          }
          sanitized.distanceKm = minDist;
        }
        return sanitized;
      });

      // Sorting
      const sortBy =
        filters.sortBy ||
        (typeof filters.latitude === 'number' && typeof filters.longitude === 'number'
          ? 'distance'
          : 'relevance');

      if (sortBy === 'distance') {
        sanitizedData.sort((a, b) => {
          const distA = a.distanceKm !== undefined ? a.distanceKm : Infinity;
          const distB = b.distanceKm !== undefined ? b.distanceKm : Infinity;
          return distA - distB;
        });
      } else if (sortBy === 'fee_asc') {
        sanitizedData.sort((a, b) => {
          const feeA = a.services.length > 0 ? Math.min(...a.services.map((s) => s.amountMinor)) : Infinity;
          const feeB = b.services.length > 0 ? Math.min(...b.services.map((s) => s.amountMinor)) : Infinity;
          return feeA - feeB;
        });
      } else if (sortBy === 'fee_desc') {
        sanitizedData.sort((a, b) => {
          const feeA = a.services.length > 0 ? Math.max(...a.services.map((s) => s.amountMinor)) : -Infinity;
          const feeB = b.services.length > 0 ? Math.max(...b.services.map((s) => s.amountMinor)) : -Infinity;
          return feeB - feeA;
        });
      }

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
    } catch {
      return this.fallback.findProviders(filters);
    }
  }

  async getProviderById(id: string, includePrivate = false): Promise<Provider | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.getProviderById(id, includePrivate);

    try {
      const projection = includePrivate ? {} : { privateVerificationRecord: 0 };
      const provider = await db.collection<Provider>('providers').findOne({ id }, { projection });
      if (!provider) return this.fallback.getProviderById(id, includePrivate);
      const copy = { ...provider };
      if (!includePrivate) {
        delete copy.privateVerificationRecord;
      }
      return copy;
    } catch {
      return this.fallback.getProviderById(id, includePrivate);
    }
  }

  async createProvider(providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider> {
    const db = await this.getDb();
    if (!db) return this.fallback.createProvider(providerData);

    const id = `prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProvider: Provider = {
      ...providerData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection('providers').insertOne({ ...newProvider });
      return { ...newProvider };
    } catch {
      return this.fallback.createProvider(providerData);
    }
  }

  async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.updateProvider(id, updates);

    try {
      const now = new Date().toISOString();
      await db.collection('providers').updateOne({ id }, { $set: { ...updates, updatedAt: now } });
      return this.getProviderById(id, true);
    } catch {
      return this.fallback.updateProvider(id, updates);
    }
  }

  async createSubmission(
    submission: Omit<ProviderSubmission, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProviderSubmission> {
    const db = await this.getDb();
    if (!db) return this.fallback.createSubmission(submission);

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newSub: ProviderSubmission = {
      ...submission,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection('submissions').insertOne({ ...newSub });
      return { ...newSub };
    } catch {
      return this.fallback.createSubmission(submission);
    }
  }

  async getSubmissions(status?: SubmissionStatus): Promise<ProviderSubmission[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getSubmissions(status);

    try {
      const filter = status ? { status } : {};
      const subs = await db.collection<ProviderSubmission>('submissions').find(filter).toArray();
      return subs.map((s: ProviderSubmission) => ({ ...s }));
    } catch {
      return this.fallback.getSubmissions(status);
    }
  }

  async getSubmissionById(id: string): Promise<ProviderSubmission | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.getSubmissionById(id);

    try {
      const sub = await db.collection<ProviderSubmission>('submissions').findOne({ id });
      return sub ? { ...sub } : this.fallback.getSubmissionById(id);
    } catch {
      return this.fallback.getSubmissionById(id);
    }
  }

  async updateSubmission(
    id: string,
    updates: Partial<ProviderSubmission>
  ): Promise<ProviderSubmission | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.updateSubmission(id, updates);

    try {
      const now = new Date().toISOString();
      await db.collection('submissions').updateOne({ id }, { $set: { ...updates, updatedAt: now } });
      return this.getSubmissionById(id);
    } catch {
      return this.fallback.updateSubmission(id, updates);
    }
  }

  // --- CC-05: Price Correction Reports & Updates ---

  async createPriceReport(
    report: Omit<PriceCorrectionReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PriceCorrectionReport> {
    const db = await this.getDb();
    if (!db) return this.fallback.createPriceReport(report);

    const id = `prep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newReport: PriceCorrectionReport = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection('price_reports').insertOne({ ...newReport });
      return { ...newReport };
    } catch {
      return this.fallback.createPriceReport(report);
    }
  }

  async getPriceReports(status?: PriceCorrectionStatus): Promise<PriceCorrectionReport[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getPriceReports(status);

    try {
      const query = status ? { status } : {};
      const reports = await db
        .collection<PriceCorrectionReport>('price_reports')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      return reports.map((r: PriceCorrectionReport) => ({ ...r }));
    } catch {
      return this.fallback.getPriceReports(status);
    }
  }

  async getPriceReportById(id: string): Promise<PriceCorrectionReport | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.getPriceReportById(id);

    try {
      const report = await db.collection<PriceCorrectionReport>('price_reports').findOne({ id });
      return report ? { ...report } : this.fallback.getPriceReportById(id);
    } catch {
      return this.fallback.getPriceReportById(id);
    }
  }

  async resolvePriceReport(
    reportId: string,
    action: {
      decision: 'accepted' | 'dismissed';
      reviewNotes: string;
      reviewedByUserId: string;
      updateProviderPrice?: boolean;
    }
  ): Promise<PriceCorrectionReport | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.resolvePriceReport(reportId, action);

    try {
      const now = new Date().toISOString();
      await db.collection('price_reports').updateOne(
        { id: reportId },
        {
          $set: {
            status: action.decision,
            reviewNotes: action.reviewNotes,
            reviewedByUserId: action.reviewedByUserId,
            reviewedAt: now,
            updatedAt: now,
          },
        }
      );

      const resolved = await this.getPriceReportById(reportId);
      if (resolved && action.decision === 'accepted' && action.updateProviderPrice) {
        await this.updateServicePrice(resolved.providerId, resolved.serviceId || '', {
          amountMinor: resolved.reportedAmountMinor,
          lastConfirmedAt: now,
          sourceType: 'patient_reported_community',
          notes: `Updated via verified patient price report: ${resolved.evidenceOrReceiptNotes}`,
        });
      }

      return resolved;
    } catch {
      return this.fallback.resolvePriceReport(reportId, action);
    }
  }

  async updateServicePrice(
    providerId: string,
    serviceId: string,
    updates: Partial<ServicePrice>
  ): Promise<Provider | null> {
    const db = await this.getDb();
    if (!db) return this.fallback.updateServicePrice(providerId, serviceId, updates);

    try {
      const now = new Date().toISOString();
      const updateDoc: Record<string, unknown> = {
        'services.$.lastConfirmedAt': updates.lastConfirmedAt || now,
        updatedAt: now,
      };
      if (updates.amountMinor !== undefined) updateDoc['services.$.amountMinor'] = updates.amountMinor;
      if (updates.sourceType !== undefined) updateDoc['services.$.sourceType'] = updates.sourceType;
      if (updates.notes !== undefined) updateDoc['services.$.notes'] = updates.notes;

      await db.collection('providers').updateOne(
        { id: providerId, 'services.id': serviceId },
        { $set: updateDoc }
      );

      return this.getProviderById(providerId);
    } catch {
      return this.fallback.updateServicePrice(providerId, serviceId, updates);
    }
  }

  async getSpecialties(): Promise<string[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getSpecialties();
    try {
      const specs = (await db.collection('providers').distinct('specialties')) as string[];
      return specs.sort();
    } catch {
      return this.fallback.getSpecialties();
    }
  }

  async getCities(): Promise<string[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getCities();
    try {
      const cities = (await db.collection('providers').distinct('facilities.city')) as string[];
      return cities.sort();
    } catch {
      return this.fallback.getCities();
    }
  }

  async getLanguages(): Promise<string[]> {
    const db = await this.getDb();
    if (!db) return this.fallback.getLanguages();
    try {
      const langs = (await db.collection('providers').distinct('languages')) as string[];
      return langs.sort();
    } catch {
      return this.fallback.getLanguages();
    }
  }
}

export const providerRepository: IProviderRepository = isMongoConfigured()
  ? new MongoProviderRepository()
  : new MemoryProviderRepository();

