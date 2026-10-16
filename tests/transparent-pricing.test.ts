import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderService } from '@/server/services/provider-service';
import { MemoryProviderRepository } from '@/server/repositories/provider-repository';
import { checkPriceStaleness, getSourceTypeLabel } from '@/shared/utils/formatters';
import { priceReportSubmissionSchema, adminResolvePriceReportSchema } from '@/server/validation/price-report';

describe('CC-05 — Transparent Pricing & Stale Price Detection', () => {
  let repo: MemoryProviderRepository;
  let service: ProviderService;

  beforeEach(() => {
    repo = new MemoryProviderRepository();
    service = new ProviderService(repo);
  });

  describe('checkPriceStaleness utility', () => {
    it('marks a fee confirmed today as fresh and not stale', () => {
      const now = new Date();
      const result = checkPriceStaleness(now.toISOString(), 90, now);

      expect(result.isStale).toBe(false);
      expect(result.daysAgo).toBe(0);
      expect(result.label).toBe('Confirmed today');
      expect(result.className).toContain('emerald');
    });

    it('marks a fee confirmed 45 days ago as fresh (<= 90 days)', () => {
      const refDate = new Date('2026-10-15T12:00:00Z');
      const confirmedDate = new Date('2026-08-31T12:00:00Z'); // 45 days earlier
      const result = checkPriceStaleness(confirmedDate.toISOString(), 90, refDate);

      expect(result.isStale).toBe(false);
      expect(result.daysAgo).toBe(45);
      expect(result.label).toBe('Confirmed 45d ago');
      expect(result.className).toContain('emerald');
    });

    it('marks a fee confirmed exactly 90 days ago as not stale', () => {
      const refDate = new Date('2026-10-15T12:00:00Z');
      const confirmedDate = new Date('2026-07-17T12:00:00Z'); // 90 days earlier
      const result = checkPriceStaleness(confirmedDate.toISOString(), 90, refDate);

      expect(result.isStale).toBe(false);
      expect(result.daysAgo).toBe(90);
    });

    it('marks a fee confirmed 91 days ago as stale with warning message', () => {
      const refDate = new Date('2026-10-15T12:00:00Z');
      const confirmedDate = new Date('2026-07-16T12:00:00Z'); // 91 days earlier
      const result = checkPriceStaleness(confirmedDate.toISOString(), 90, refDate);

      expect(result.isStale).toBe(true);
      expect(result.daysAgo).toBe(91);
      expect(result.label).toBe('Unverified >90d');
      expect(result.className).toContain('amber');
      expect(result.warningMessage).toContain('91 days ago');
      expect(result.warningMessage).toContain('confirm directly with reception');
    });

    it('respects a custom staleness threshold (e.g. 30 days)', () => {
      const refDate = new Date('2026-10-15T12:00:00Z');
      const confirmedDate = new Date('2026-09-10T12:00:00Z'); // 35 days earlier
      const result = checkPriceStaleness(confirmedDate.toISOString(), 30, refDate);

      expect(result.isStale).toBe(true);
      expect(result.label).toBe('Unverified >30d');
    });

    it('safely handles invalid or unparseable date strings', () => {
      const result = checkPriceStaleness('invalid-date-string');

      expect(result.isStale).toBe(true);
      expect(result.daysAgo).toBe(999);
      expect(result.label).toBe('Date unverified');
      expect(result.warningMessage).toContain('could not be established');
    });
  });

  describe('getSourceTypeLabel utility', () => {
    it('returns human-readable labels for standard fee evidence sources', () => {
      expect(getSourceTypeLabel('clinic_verified_fee_schedule')).toBe('Official Clinic Tariff Schedule');
      expect(getSourceTypeLabel('reception_confirmed')).toBe('Direct Reception Inquiry');
      expect(getSourceTypeLabel('facility_website_published')).toBe('Facility Website Published Rate');
      expect(getSourceTypeLabel('patient_reported_community')).toBe('Patient Community Submission');
    });

    it('formats unknown source types nicely', () => {
      expect(getSourceTypeLabel('hospital_internal_board')).toBe('Hospital Internal Board');
    });
  });

  describe('Price Discrepancy Validation Schemas', () => {
    it('validates a correct community price report submission', () => {
      const input = {
        providerId: 'demo-prov-001',
        serviceName: 'General Consultation',
        reportedAmountMinor: 120000, // ₹1,200 in paise
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Visited today and receipt shows ₹1,200 charged at reception.',
        reporterEmail: 'patient@example.com',
      };

      const result = priceReportSubmissionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects 0 or negative price amounts', () => {
      const zeroInput = {
        providerId: 'demo-prov-001',
        serviceName: 'General Consultation',
        reportedAmountMinor: 0,
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Zero amount should be rejected.',
      };
      expect(priceReportSubmissionSchema.safeParse(zeroInput).success).toBe(false);

      const negativeInput = {
        providerId: 'demo-prov-001',
        serviceName: 'General Consultation',
        reportedAmountMinor: -50000,
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Negative amount should be rejected.',
      };
      expect(priceReportSubmissionSchema.safeParse(negativeInput).success).toBe(false);
    });

    it('rejects floating point amounts in paise (must be integer)', () => {
      const floatInput = {
        providerId: 'demo-prov-001',
        serviceName: 'General Consultation',
        reportedAmountMinor: 850.5,
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Floating point paise should fail.',
      };
      expect(priceReportSubmissionSchema.safeParse(floatInput).success).toBe(false);
    });

    it('validates admin resolve price report payload', () => {
      const valid = {
        decision: 'accepted',
        reviewNotes: 'Confirmed with front desk reception ledger.',
        updateProviderPrice: true,
      };
      expect(adminResolvePriceReportSchema.safeParse(valid).success).toBe(true);

      const invalidDecision = {
        decision: 'pending_review', // cannot resolve to pending_review
        reviewNotes: 'Invalid decision state',
      };
      expect(adminResolvePriceReportSchema.safeParse(invalidDecision).success).toBe(false);
    });
  });

  describe('ProviderService Price Discrepancy Workflow', () => {
    it('allows a traveler to submit a price discrepancy report against an existing provider', async () => {
      const report = await service.submitPriceReport('user-traveler-42', {
        providerId: 'demo-prov-001',
        serviceName: 'General Dermatology Consultation',
        reportedAmountMinor: 100000, // ₹1,000 reported (listed was ₹800)
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Invoice #KOL-4829 provided at checkout desk.',
        reporterEmail: 'traveler@example.com',
      });

      expect(report).toBeDefined();
      expect(report.id).toMatch(/^prep-/);
      expect(report.providerId).toBe('demo-prov-001');
      expect(report.serviceName).toBe('General Dermatology Consultation');
      expect(report.reportedAmountMinor).toBe(100000);
      expect(report.status).toBe('pending_review');
      expect(report.submittedByUserId).toBe('user-traveler-42');
      expect(report.evidenceOrReceiptNotes).toBe('Invoice #KOL-4829 provided at checkout desk.');
    });

    it('fails when submitting a report for a non-existent provider', async () => {
      await expect(
        service.submitPriceReport('user-1', {
          providerId: 'non-existent-id',
          serviceName: 'Consultation',
          reportedAmountMinor: 100000,
          observedDate: '2026-10-15',
          evidenceOrReceiptNotes: 'Provider does not exist test note.',
        })
      ).rejects.toThrow('Provider non-existent-id not found');
    });

    it('fails when submitting a report for a non-existent service name', async () => {
      await expect(
        service.submitPriceReport('user-1', {
          providerId: 'demo-prov-001',
          serviceName: 'Brain Surgery (Non-existent)',
          reportedAmountMinor: 5000000,
          observedDate: '2026-10-15',
          evidenceOrReceiptNotes: 'Non-existent service name test note.',
        })
      ).rejects.toThrow('Service "Brain Surgery (Non-existent)" not found for this provider');
    });

    it('lists seeded and submitted price reports with optional status filtering', async () => {
      // Seeded report prep-001 is already pending_review
      const pending = await service.getPriceReports('pending_review');
      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(pending.some((r) => r.id === 'prep-001')).toBe(true);

      const all = await service.getPriceReports();
      expect(all.length).toBeGreaterThanOrEqual(pending.length);
    });

    it('allows an administrator to dismiss a price report without updating public provider rates', async () => {
      const initialProvider = await repo.getProviderById('demo-prov-002');
      const initialPrice = initialProvider?.services[0]?.amountMinor;

      const report = await service.submitPriceReport('user-anon', {
        providerId: 'demo-prov-002',
        serviceName: 'General Health Consultation',
        reportedAmountMinor: 300000, // Invalid claim
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Unverified claim without official invoice.',
      });

      const resolved = await service.resolvePriceReport(
        'admin-user-01',
        report.id,
        {
          decision: 'dismissed',
          reviewNotes: 'Dismissed: Caller misquoted ancillary lab work as consultation.',
          updateProviderPrice: false,
        }
      );

      expect(resolved.status).toBe('dismissed');
      expect(resolved.reviewedByUserId).toBe('admin-user-01');
      expect(resolved.reviewNotes).toContain('Caller misquoted ancillary lab work');

      // Provider public price should remain unchanged
      const updatedProvider = await repo.getProviderById('demo-prov-002');
      expect(updatedProvider?.services[0]?.amountMinor).toBe(initialPrice);
    });

    it('accepts a price report with updateProviderPrice: true and updates directory price, timestamp, and source', async () => {
      // 1. Submit discrepancy report against demo-prov-001
      const report = await service.submitPriceReport('user-traveler-99', {
        providerId: 'demo-prov-001',
        serviceName: 'General Dermatology Consultation',
        reportedAmountMinor: 110000, // ₹1,100 (up from ₹800)
        observedDate: '2026-10-15',
        evidenceOrReceiptNotes: 'Verified receipt from hospital desk checkout.',
      });

      // 2. Admin accepts report and approves directory price update
      const resolved = await service.resolvePriceReport(
        'admin-super',
        report.id,
        {
          decision: 'accepted',
          reviewNotes: 'Confirmed with front desk reception tariff update.',
          updateProviderPrice: true,
        }
      );

      expect(resolved.status).toBe('accepted');
      expect(resolved.reviewedByUserId).toBe('admin-super');

      // 3. Verify public directory provider was updated
      const updatedProvider = await repo.getProviderById('demo-prov-001');
      expect(updatedProvider).toBeDefined();

      const serviceObj = updatedProvider?.services.find(
        (s) => s.serviceName === 'General Dermatology Consultation'
      );
      expect(serviceObj).toBeDefined();
      expect(serviceObj?.amountMinor).toBe(110000); // Updated to ₹1,100
      expect(serviceObj?.sourceType).toBe('patient_reported_community');

      // 4. Verify fresh timestamp reset
      const staleness = checkPriceStaleness(serviceObj?.lastConfirmedAt || '');
      expect(staleness.isStale).toBe(false);
      expect(staleness.daysAgo).toBe(0);
    });
  });

  describe('Search and Filter by Pricing', () => {
    it('filters providers by maximum fee (maxFeeMinor)', async () => {
      // Filter for fee <= ₹1,000 (100000 paise)
      const res = await service.searchProviders({
        maxFeeMinor: 100000,
        page: 1,
        limit: 10,
      });

      expect(res.data.length).toBeGreaterThan(0);
      for (const provider of res.data) {
        const minFee = Math.min(...provider.services.map((s) => s.amountMinor));
        expect(minFee).toBeLessThanOrEqual(100000);
      }
    });

    it('sorts providers by fee ascending (fee_asc)', async () => {
      const res = await service.searchProviders({
        sortBy: 'fee_asc',
        page: 1,
        limit: 10,
      });

      expect(res.data.length).toBeGreaterThan(1);
      const fees = res.data.map((p) =>
        p.services.length > 0 ? Math.min(...p.services.map((s) => s.amountMinor)) : Infinity
      );
      for (let i = 0; i < fees.length - 1; i++) {
        expect(fees[i]).toBeLessThanOrEqual(fees[i + 1]);
      }
    });

    it('sorts providers by fee descending (fee_desc)', async () => {
      const res = await service.searchProviders({
        sortBy: 'fee_desc',
        page: 1,
        limit: 10,
      });

      expect(res.data.length).toBeGreaterThan(1);
      const fees = res.data.map((p) =>
        p.services.length > 0 ? Math.max(...p.services.map((s) => s.amountMinor)) : -Infinity
      );
      for (let i = 0; i < fees.length - 1; i++) {
        expect(fees[i]).toBeGreaterThanOrEqual(fees[i + 1]);
      }
    });
  });
});
