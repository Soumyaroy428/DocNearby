# Checkpoint CC-05 — Transparent Pricing & Stale Price Detection

**Status:** Completed & Verified  
**Date:** 2026-10-16  
**Test Suite:** `tests/transparent-pricing.test.ts` (21/21 passing, 76/76 overall)  
**Typecheck:** Passed (`tsc --noEmit` zero errors)  
**Production Build:** Clean (`next build` 22/22 static pages generated)  

---

## 1. Executive Summary & Objective

In healthcare discovery—particularly for travelers in unfamiliar cities—unpredictable consultation pricing and stale fee schedules cause severe financial shock and vulnerability.

**CC-05 enforces end-to-end price transparency across DocNearby:**
1. **Granular Price Taxonomy:** All consultation fees record amount (in minor integer paise), currency (INR), price type (`confirmed`, `starting_from`, `estimate`, `unavailable`), explicit evidence source (e.g. `clinic_verified_fee_schedule`, `reception_confirmed`, `facility_website_published`, `patient_reported_community`), and exact freshness confirmation timestamp (`lastConfirmedAt`).
2. **Stale Price Detection Invariant:** Pricing quotes older than statutory threshold (90 days) are flagged with amber warning badges (`Unverified >90d`), preventing travelers from mistaking historical quotes for guaranteed current rates.
3. **Community Price Discrepancy Reporting:** Travelers and patients can submit on-site receipt notes and observed consultation fees directly via `PriceReportModal.tsx` (`POST /api/v1/providers/[id]/price-report`).
4. **Trust Operations Price Audit & Resolution:** Platform administrators review submitted discrepancy reports (`GET /api/v1/admin/price-reports`), inspect evidence, and decide to accept or dismiss with review notes. If accepted with `updateProviderPrice: true`, the public directory rate is updated, timestamp reset to current, and tagged as `patient_reported_community` (`POST /api/v1/admin/price-reports/[id]/resolve`).
5. **Side-by-Side Provider Comparison:** A floating comparison drawer (`ProviderComparisonDrawer.tsx`) allows comparing consultation fees, evidence sources, freshness, verification badges, languages, and accessibility across up to 3 providers simultaneously.

---

## 2. Architecture & File Breakdown

### Shared Layer (`shared/`)
- `shared/types/provider.ts`:
  - `PriceCorrectionStatus`: `'pending_review' | 'accepted' | 'dismissed'`
  - `PriceCorrectionReport`: Captures `providerId`, `serviceName`, `listedAmountMinor`, `reportedAmountMinor`, `observedDate`, `evidenceOrReceiptNotes`, `status`, `reviewNotes`, `reviewedByUserId`, `reviewedAt`, timestamps.
  - `PriceStalenessInfo`: `{ isStale, daysAgo, label, warningMessage }`
- `shared/utils/formatters.ts`:
  - `formatPaiseToRupees(amountMinor)`: Currency formatter with Indian Rupee formatting.
  - `getSourceTypeLabel(sourceType)`: Maps source codes to human-readable labels.
  - `checkPriceStaleness(lastConfirmedAt, threshold=90, refDate)`: Computes elapsed days; produces warning guidance and badge metadata.
  - `formatRelativeTime(isoString)`: Contextual relative timestamp formatter.

### Server Layer (`server/`)
- `server/validation/price-report.ts`:
  - `priceReportSubmissionSchema`: Zod validation for user discrepancy reports.
  - `adminResolvePriceReportSchema`: Zod validation for administrator resolution decisions.
- `server/repositories/provider-repository.ts`:
  - `IProviderRepository`: Added `createPriceReport`, `getPriceReports`, `getPriceReportById`, `resolvePriceReport`, `updateServicePrice`.
  - `MemoryProviderRepository`: Seeded with demonstration report `prep-001`, in-memory mutations.
  - `MongoProviderRepository`: Dedicated `price_reports` MongoDB collection with seamless in-memory fallback.
  - Fee sorting: Monotonic sorting by minimum consultation fee (`fee_asc`) or maximum fee (`fee_desc`).
- `server/services/provider-service.ts`:
  - `submitPriceReport(userId, rawInput)`: Validates input, verifies provider existence, matches service, records `listedAmountMinor`, stores report.
  - `getPriceReports(status)`: Lists reports with optional status filtering.
  - `resolvePriceReport(adminUserId, reportId, rawInput)`: Updates report audit state and updates directory listing if approved.

### API Adapters (`app/api/`)
- `app/api/v1/providers/[id]/price-report/route.ts` -> `server/api/provider-price-report.ts` (POST)
- `app/api/v1/admin/price-reports/route.ts` -> `server/api/admin-price-reports.ts` (GET, admin RBAC)
- `app/api/v1/admin/price-reports/[id]/resolve/route.ts` -> `server/api/admin-resolve-price-report.ts` (POST, admin RBAC)

### Client UI Layer (`client/`)
- `client/components/pricing/PriceReportModal.tsx`: Accessible dialog allowing visitors to submit observed prices with receipt evidence notes.
- `client/components/pricing/ProviderComparisonDrawer.tsx`: Floating bottom drawer and modal comparison table comparing fees, freshness, evidence sources, verification, languages, and accessibility for up to 3 providers.
- `client/components/providers/ProviderCard.tsx`: Updated with comparison toggle and staleness warning badge.
- `client/components/providers/ProviderDetailsView.tsx`: Displays price source, freshness badge, and "Report Discrepancy" action button.
- `client/views/HomePageView.tsx`: Wired up comparison selection state (up to 3 providers) and drawer integration.
- `client/views/AdminPriceReportsPageView.tsx` & `app/admin/price-reports/page.tsx`: Trust Operations portal for filtering, reviewing, and resolving price reports.
- `client/components/layout/Header.tsx`: Added navigation links for administrators (`Verifications` & `Price Reports`).

---

## 3. Test Evidence

```
 ✓ tests/utils.test.ts (4 tests)
 ✓ tests/ai-search-service.test.ts (4 tests)
 ✓ tests/object-level-auth.test.ts (6 tests)
 ✓ tests/geospatial-search.test.ts (13 tests)
 ✓ tests/provider-service.test.ts (11 tests)
 ✓ tests/provider-verification.test.ts (8 tests)
 ✓ tests/transparent-pricing.test.ts (21 tests)
 ✓ tests/auth-service.test.ts (9 tests)

 Test Files  8 passed (8)
      Tests  76 passed (76)
```

### Coverage Highlights in `tests/transparent-pricing.test.ts`:
- Fresh vs stale fee boundaries (0 days, 45 days, 90 days fresh; 91 days stale).
- Custom threshold support (30 days) and unparseable date fallbacks.
- Source label formatting for all evidence types.
- Positive integer paise validation (rejects zero, negative, floats).
- Price report submission and association with provider and service.
- Admin dismissal without public rate mutation.
- Admin acceptance with `updateProviderPrice: true` updating consultation fee, timestamp, and tagging source as `patient_reported_community`.
- Search filters: `maxFeeMinor` cap and ascending (`fee_asc`) / descending (`fee_desc`) fee sorting.

---

## 4. Verification Checkpoint Status

- [x] Currency, amount, price type, source, and timestamp recorded in records.
- [x] Confirmed/estimate/starting/not-provided badges displayed.
- [x] Stale price indicators (>90 days) and community correction workflow operational.
- [x] Multi-provider comparison drawer (up to 3 providers) implemented.
- [x] Filter, sorting, and pricing unit tests verified (76/76 passed).
- [x] TypeScript typechecking passed (`tsc --noEmit` clean).
- [x] Next.js production build succeeded (`npm run build` clean).
