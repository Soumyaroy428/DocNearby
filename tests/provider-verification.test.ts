import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderService } from '@/server/services/provider-service';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';
import { ZodError } from 'zod';

describe('CC-03 — Provider Directory & Verification Lifecycle', () => {
  let repo: MemoryProviderRepository;
  let service: ProviderService;

  beforeEach(() => {
    repo = new MemoryProviderRepository();
    service = new ProviderService(repo);
  });

  describe('Provider Application Submission', () => {
    it('creates a new pending application with valid medical credentials', async () => {
      const input = {
        applicantName: 'Dr. Debashis Sen',
        applicantEmail: 'debashis.sen@example.com',
        applicantRole: 'Orthopedic Consultant',
        displayName: 'Sen Orthopedic & Joint Care Clinic',
        providerType: 'doctor' as const,
        specialties: ['Orthopedics', 'Sports Medicine'],
        languages: ['English', 'Bengali'],
        qualifications: ['MBBS', 'MS (Ortho)'],
        experienceYears: 12,
        registrationReference: 'WBMC-REG-2014-9988',
        authorityName: 'West Bengal Medical Council',
        documentStorageRef: 'VAULT/CERT/2014-9988.pdf',
        locality: 'Salt Lake',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        consultationFeeMinor: 90000, // ₹900
        publicPhone: '+91 33 2345 6789',
        publicEmail: 'contact@senortho.example.com',
      };

      const submission = await service.submitProviderApplication('user-provider-001', input);

      expect(submission).toBeDefined();
      expect(submission.id).toMatch(/^sub-/);
      expect(submission.status).toBe('pending_review');
      expect(submission.submittedByUserId).toBe('user-provider-001');
      expect(submission.registrationReference).toBe('WBMC-REG-2014-9988');
      expect(submission.authorityName).toBe('West Bengal Medical Council');
    });

    it('rejects submission with invalid email or missing registration reference', async () => {
      const invalidInput = {
        applicantName: 'Dr. Invalid',
        applicantEmail: 'not-an-email',
        applicantRole: 'Doctor',
        displayName: 'Test Clinic',
        providerType: 'doctor',
        specialties: [], // Empty specialties should fail
        languages: ['English'],
        qualifications: ['MBBS'],
        registrationReference: '', // Missing registration should fail
        authorityName: 'Council',
        locality: 'Salt Lake',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: 50000,
        publicPhone: '+91 33 1234 5678',
      };

      await expect(service.submitProviderApplication('user-provider-001', invalidInput)).rejects.toThrow(
        ZodError
      );
    });

    it('rejects submission with negative consultation fee', async () => {
      const invalidFee = {
        applicantName: 'Dr. Test',
        applicantEmail: 'test@example.com',
        applicantRole: 'Doctor',
        displayName: 'Test Clinic',
        providerType: 'doctor',
        specialties: ['General Medicine'],
        languages: ['English'],
        qualifications: ['MBBS'],
        registrationReference: 'REG-123',
        authorityName: 'State Council',
        locality: 'Salt Lake',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: -500, // Negative fee should fail
        publicPhone: '+91 33 1234 5678',
      };

      await expect(service.submitProviderApplication('user-provider-001', invalidFee)).rejects.toThrow(
        ZodError
      );
    });
  });

  describe('Administrative Verification & Directory Publishing', () => {
    it('approves application and publishes verified provider with evidence detail', async () => {
      // 1. Submit an application
      const submission = await service.submitProviderApplication('user-provider-001', {
        applicantName: 'Dr. Rina Ghosh',
        applicantEmail: 'rina.ghosh@example.com',
        applicantRole: 'Consultant Gynecologist',
        displayName: 'Dr. Rina Ghosh Women Care',
        providerType: 'doctor',
        specialties: ['Gynecology', 'Obstetrics'],
        languages: ['English', 'Bengali', 'Hindi'],
        qualifications: ['MBBS', 'MD (OBGYN)'],
        experienceYears: 16,
        registrationReference: 'WBMC-REG-2008-5432',
        authorityName: 'West Bengal Medical Council',
        locality: 'Ballygunge',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: 100000, // ₹1,000
        publicPhone: '+91 33 2468 1357',
      });

      // 2. Admin reviews and approves with statutory evidence
      const adminAction = {
        decision: 'approved' as const,
        evidenceType: 'state_medical_council_registration',
        whatWasChecked: 'Verified registration active and in good standing on West Bengal Medical Council registry.',
        reviewNotes: 'Valid license, degree certificates and statutory standing confirmed.',
      };

      const reviewedSub = await service.reviewSubmission('user-admin-001', submission.id, adminAction);

      expect(reviewedSub.status).toBe('approved');
      expect(reviewedSub.reviewedBy).toBe('user-admin-001');
      expect(reviewedSub.createdProviderId).toBeDefined();

      // 3. Verify newly published provider exists in the public directory
      const publishedProvider = await service.getProviderById(reviewedSub.createdProviderId!);
      expect(publishedProvider).not.toBeNull();
      expect(publishedProvider?.displayName).toBe('Dr. Rina Ghosh Women Care');
      expect(publishedProvider?.verificationStatus).toBe('verified');
      expect(publishedProvider?.isDemonstration).toBe(false);
      expect(publishedProvider?.verificationDetail?.evidenceType).toBe('state_medical_council_registration');
      expect(publishedProvider?.verificationDetail?.checkedBy).toContain('user-admin-001');
    });

    it('rejects an application cleanly with recorded audit notes', async () => {
      const submission = await service.submitProviderApplication('user-provider-001', {
        applicantName: 'Fake Doctor',
        applicantEmail: 'fake@example.com',
        applicantRole: 'Unknown',
        displayName: 'Fake Clinic',
        providerType: 'doctor',
        specialties: ['General Medicine'],
        languages: ['English'],
        qualifications: ['None'],
        registrationReference: 'INVALID-9999',
        authorityName: 'Non-existent Council',
        locality: 'Salt Lake',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: 50000,
        publicPhone: '+91 33 0000 0000',
      });

      const rejectedSub = await service.reviewSubmission('user-admin-001', submission.id, {
        decision: 'rejected',
        evidenceType: 'state_medical_council_registration',
        whatWasChecked: 'Registration number not found in statutory council registry.',
        reviewNotes: 'Rejected: Inability to confirm credentials on official database.',
      });

      expect(rejectedSub.status).toBe('rejected');
      expect(rejectedSub.createdProviderId).toBeUndefined();
    });
  });

  describe('Public vs. Private Field Separation (Confidentiality Protection)', () => {
    it('NEVER leaks privateVerificationRecord in public provider profile calls', async () => {
      // 1. Submit and approve a provider
      const submission = await service.submitProviderApplication('user-provider-001', {
        applicantName: 'Dr. Secret Test',
        applicantEmail: 'secret@example.com',
        applicantRole: 'Doctor',
        displayName: 'Dr. Secret Clinic',
        providerType: 'doctor',
        specialties: ['General Medicine'],
        languages: ['English'],
        qualifications: ['MBBS'],
        registrationReference: 'CONFIDENTIAL-REG-1234',
        authorityName: 'Medical Council',
        documentStorageRef: 'TOP-SECRET-VAULT-ID/DOC.PDF',
        locality: 'Kolkata',
        city: 'Kolkata',
        country: 'India',
        consultationFeeMinor: 70000,
        publicPhone: '+91 33 1111 2222',
      });

      const reviewed = await service.reviewSubmission('user-admin-001', submission.id, {
        decision: 'approved',
        evidenceType: 'state_medical_council_registration',
        whatWasChecked: 'Checked registry',
        reviewNotes: 'Internal confidential investigator notes not for public eyes',
      });

      const providerId = reviewed.createdProviderId!;

      // 2. Public lookup (includePrivate = false, the default)
      const publicProvider = await service.getProviderById(providerId, false);
      expect(publicProvider).not.toBeNull();
      // MUST BE STRICTLY UNDEFINED in public response!
      expect(publicProvider?.privateVerificationRecord).toBeUndefined();

      // 3. Public directory search
      const searchResult = await service.searchProviders({ query: 'Dr. Secret Clinic' });
      expect(searchResult.data.length).toBe(1);
      expect(searchResult.data[0].privateVerificationRecord).toBeUndefined();

      // 4. Authorized backend / admin inspection (includePrivate = true)
      const internalProvider = await service.getProviderById(providerId, true);
      expect(internalProvider?.privateVerificationRecord).toBeDefined();
      expect(internalProvider?.privateVerificationRecord?.internalNotes).toContain(
        'Internal confidential investigator notes'
      );
      expect(internalProvider?.privateVerificationRecord?.documentStorageRef).toBe(
        'TOP-SECRET-VAULT-ID/DOC.PDF'
      );
    });
  });

  describe('Suspension and Reinstatement Governance Lifecycle', () => {
    it('suspends an active provider listing and updates verification status', async () => {
      const providerId = 'demo-prov-001';

      // Suspend listing
      const suspended = await service.suspendProvider(
        'user-admin-001',
        providerId,
        { reason: 'Statutory audit dispute reported by state medical board' }
      );

      expect(suspended.verificationStatus).toBe('suspended');
      expect(suspended.verificationSummary).toContain('temporarily suspended');

      // Verify search reflects suspended status
      const searchResult = await service.searchProviders({ verificationStatus: 'suspended' });
      expect(searchResult.data.some((p) => p.id === providerId)).toBe(true);
    });

    it('reinstates a suspended provider following successful re-verification', async () => {
      const providerId = 'demo-prov-001';

      // Suspend
      await service.suspendProvider('user-admin-001', providerId, { reason: 'Pending recheck' });

      // Reinstate
      const reinstated = await service.reinstateProvider(
        'user-admin-001',
        providerId,
        'Council recheck completed. License confirmed in good standing.'
      );

      expect(reinstated.verificationStatus).toBe('verified');
      expect(reinstated.verificationSummary).toContain('re-verified');
      expect(reinstated.verificationDetail?.evidenceType).toBe('reverification_check');
    });
  });
});

