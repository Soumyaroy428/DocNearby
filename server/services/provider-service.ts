import { IProviderRepository, providerRepository } from '@/server/repositories/provider-repository';
import { searchQuerySchema } from '@/server/validation/search';
import {
  providerSubmissionSchema,
  ProviderSubmissionInput,
  adminReviewActionSchema,
  AdminReviewActionInput,
  adminSuspendActionSchema,
} from '@/server/validation/provider-application';
import {
  Provider,
  PaginatedResult,
  ProviderSubmission,
  SubmissionStatus,
} from '@/shared/types/provider';

export class ProviderService {
  constructor(private repo: IProviderRepository = providerRepository) {}

  async searchProviders(params: Record<string, unknown>): Promise<PaginatedResult<Provider>> {
    const validated = searchQuerySchema.parse(params);
    return this.repo.findProviders(validated);
  }

  async getProviderById(id: string, includePrivate = false): Promise<Provider | null> {
    if (!id || typeof id !== 'string') return null;
    return this.repo.getProviderById(id, includePrivate);
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

  // --- CC-03: Provider Onboarding & Directory Management ---

  async submitProviderApplication(
    userId: string,
    rawInput: unknown
  ): Promise<ProviderSubmission> {
    const validated = providerSubmissionSchema.parse(rawInput);

    return this.repo.createSubmission({
      submittedByUserId: userId,
      applicantName: validated.applicantName,
      applicantEmail: validated.applicantEmail,
      applicantRole: validated.applicantRole,
      displayName: validated.displayName,
      providerType: validated.providerType,
      specialties: validated.specialties,
      languages: validated.languages,
      qualifications: validated.qualifications,
      experienceYears: validated.experienceYears,
      registrationReference: validated.registrationReference,
      authorityName: validated.authorityName,
      documentStorageRef: validated.documentStorageRef,
      locality: validated.locality,
      city: validated.city,
      state: validated.state,
      country: validated.country,
      consultationFeeMinor: validated.consultationFeeMinor,
      publicPhone: validated.publicPhone,
      publicEmail: validated.publicEmail || undefined,
      publicWebsite: validated.publicWebsite || undefined,
      status: 'pending_review',
    });
  }

  async getSubmissions(status?: SubmissionStatus): Promise<ProviderSubmission[]> {
    return this.repo.getSubmissions(status);
  }

  async getSubmissionById(id: string): Promise<ProviderSubmission | null> {
    return this.repo.getSubmissionById(id);
  }

  async reviewSubmission(
    adminUserId: string,
    submissionId: string,
    rawAction: unknown
  ): Promise<ProviderSubmission> {
    const action = adminReviewActionSchema.parse(rawAction);
    const submission = await this.repo.getSubmissionById(submissionId);

    if (!submission) {
      throw new Error('Provider application submission not found.');
    }

    const now = new Date().toISOString();

    if (action.decision === 'approved') {
      // 1. Create the active verified Provider record in the directory
      const createdProvider = await this.repo.createProvider({
        displayName: submission.displayName,
        providerType: submission.providerType,
        specialties: submission.specialties,
        languages: submission.languages,
        qualifications: submission.qualifications,
        experienceYears: submission.experienceYears,
        registrationReference: submission.registrationReference,
        verificationStatus: 'verified',
        verificationSummary: `Official statutory registration verified against ${submission.authorityName}.`,
        verificationDetail: {
          evidenceType: action.evidenceType,
          checkedBy: `DocNearby Trust Operations (${adminUserId})`,
          checkedAt: now,
          expiresAt: action.expiresAt || undefined,
          whatWasChecked: action.whatWasChecked,
        },
        facilities: [
          {
            id: `fac-${Date.now()}`,
            name: `${submission.displayName} Facility`,
            address: `${submission.locality}, ${submission.city}`,
            locality: submission.locality,
            city: submission.city,
            state: submission.state,
            country: submission.country,
            publicPhone: submission.publicPhone,
          },
        ],
        services: [
          {
            id: `srv-${Date.now()}`,
            serviceName: 'Standard Consultation',
            amountMinor: submission.consultationFeeMinor,
            currency: 'INR',
            priceType: 'confirmed',
            sourceType: 'provider_declared_verified',
            lastConfirmedAt: now,
          },
        ],
        publicContact: {
          phone: submission.publicPhone,
          email: submission.publicEmail,
          website: submission.publicWebsite,
        },
        isDemonstration: false,
        // Private confidential verification record stored strictly on backend
        privateVerificationRecord: {
          licenseRegistrationNumber: submission.registrationReference,
          authorityName: submission.authorityName,
          documentStorageRef: submission.documentStorageRef,
          reviewedByUserId: adminUserId,
          reviewedAt: now,
          internalNotes: action.reviewNotes,
        },
      });

      // 2. Mark submission as approved and attach createdProviderId
      const updatedSubmission = await this.repo.updateSubmission(submissionId, {
        status: 'approved',
        reviewNotes: action.reviewNotes,
        reviewedBy: adminUserId,
        reviewedAt: now,
        createdProviderId: createdProvider.id,
      });

      return updatedSubmission!;
    } else {
      // Rejection or requires_correction
      const newStatus: SubmissionStatus =
        action.decision === 'rejected' ? 'rejected' : 'requires_correction';
      const updatedSubmission = await this.repo.updateSubmission(submissionId, {
        status: newStatus,
        reviewNotes: action.reviewNotes,
        reviewedBy: adminUserId,
        reviewedAt: now,
      });

      return updatedSubmission!;
    }
  }

  async suspendProvider(
    adminUserId: string,
    providerId: string,
    rawReason: unknown
  ): Promise<Provider> {
    const { reason } = adminSuspendActionSchema.parse(rawReason);
    const provider = await this.repo.getProviderById(providerId, true);

    if (!provider) {
      throw new Error('Healthcare provider not found.');
    }

    const now = new Date().toISOString();
    const updated = await this.repo.updateProvider(providerId, {
      verificationStatus: 'suspended',
      verificationSummary: `Listing temporarily suspended pending credential re-verification: ${reason}`,
      privateVerificationRecord: {
        licenseRegistrationNumber: provider.registrationReference || 'UNKNOWN',
        reviewedByUserId: adminUserId,
        reviewedAt: now,
        internalNotes: `SUSPENDED by ${adminUserId}: ${reason}`,
      },
    });

    if (!updated) {
      throw new Error('Failed to update provider status.');
    }

    return updated;
  }

  async reinstateProvider(
    adminUserId: string,
    providerId: string,
    whatWasChecked: string
  ): Promise<Provider> {
    const provider = await this.repo.getProviderById(providerId, true);
    if (!provider) {
      throw new Error('Healthcare provider not found.');
    }

    const now = new Date().toISOString();
    const updated = await this.repo.updateProvider(providerId, {
      verificationStatus: 'verified',
      verificationSummary: `Regulatory registration re-verified and confirmed in good standing.`,
      verificationDetail: {
        evidenceType: 'reverification_check',
        checkedBy: `DocNearby Trust Operations (${adminUserId})`,
        checkedAt: now,
        whatWasChecked,
      },
      privateVerificationRecord: {
        licenseRegistrationNumber: provider.registrationReference || 'UNKNOWN',
        reviewedByUserId: adminUserId,
        reviewedAt: now,
        internalNotes: `Reinstated after recheck by ${adminUserId}: ${whatWasChecked}`,
      },
    });

    return updated!;
  }
}

export const providerService = new ProviderService();
