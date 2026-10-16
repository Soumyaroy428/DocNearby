# DocNearby — Working PRD and Evidence Tracker

**Purpose:** Keep intended scope separate from verified implementation.

## Status definitions
- `NOT STARTED`: no implementation attempted.
- `WORKING`: currently being implemented.
- `PARTIAL`: some requirements implemented, others missing.
- `BROKEN`: attempted feature fails relevant checks.
- `UNVERIFIED`: code or configuration may exist, but evidence is insufficient.
- `VERIFIED`: acceptance criteria passed with recorded evidence.

## Current state
Baseline repository audit (CC-00) completed on 2026-10-15. The repository is a **greenfield workspace** containing only the 10 specification documents located in `DocNearby_Project_Docs/`. No application source code, package manifests, or test suites currently exist. Git root was detected at user home (`C:/Users/soumy`) due to absence of local `.git` in `DocNearby`.

## Checkpoint tracker

| Checkpoint | Scope | Status | Evidence / notes |
|---|---|---|---|
| CC-00 | Repository audit and baseline | VERIFIED | Read-only audit completed; 10 docs inspected; environment verified (Node v22.21.0, npm 11.12.1, git 2.51.2). Documented in CC-00 report. |
| CC-01 | Manual search + optional AI filter extraction | VERIFIED | Scaffolding complete; public discovery search page, AI search intent box, manual filters, provider cards, provider details page, demo datasets with clear labels, and Next.js route handlers implemented. 19 unit/integration tests passed; production build passed. |
| CC-02 | Authentication and authorization | VERIFIED | Implemented registration, scrypt password hashing, HMAC session tokens, user roles (traveler/provider/admin), saved providers, profile updates, and strict object-level isolation. 34 tests passing; production build verified. |
| CC-03 | Provider directory and verification | NOT STARTED | Awaiting CC-02 user review and approval before starting. |
| CC-04 | Maps and location | NOT STARTED | Awaiting preceding checkpoints. |
| CC-05 | Transparent pricing | NOT STARTED | Awaiting preceding checkpoints. |
| CC-06 | Appointments and notifications | NOT STARTED | Awaiting preceding checkpoints. |
| CC-07 | AI and multilingual assistance | NOT STARTED | Awaiting preceding checkpoints. |
| CC-08 | Reviews and trust | NOT STARTED | Awaiting preceding checkpoints. |
| CC-09 | Security, deployment, pilot | NOT STARTED | Requires complete implementation, security, legal, and production review. |

---

## Baseline Audit Findings (CC-00)

### 1. Repository Structure & Codebase Status
- **Workspace directory:** `c:\Users\soumy\OneDrive\Desktop\DocNearby`
- **Existing files:** Only the `DocNearby_Project_Docs/` directory with 10 Markdown specification documents.
- **Missing files:**
  - `package.json` and lockfile
  - `tsconfig.json`
  - Next.js application directory (`app/` or `src/app/`)
  - Components, libraries, or service modules
  - Test configurations (`vitest.config.ts`, `playwright.config.ts`, etc.)
  - Environment files (`.env`, `.env.example`)
  - Project-level `.gitignore` and `.git` repository

### 2. Existing Features
- **None.** Codebase is in greenfield state.

### 3. Missing Features
- Public search page with city/locality, specialty, and language filters (FR-01).
- Provider result cards and profile details pages (FR-02, FR-03).
- Verification-status labels and evidence models (FR-04).
- Transparent pricing models, source tags, and freshness timestamps (FR-05).
- Location search, manual entry fallback, and geospatial indexing (FR-06).
- User authentication and role-based access control (FR-07).
- Appointment request workflows and status management (FR-08).
- Optional AI filter conversion service with structured Zod schema validation (FR-09).
- Review and moderation system (FR-10).
- Admin management workflows and audit logging (FR-11).
- Healthcare safety disclaimers and emergency guidance (FR-12).

### 4. Broken Features
- None (no code has been implemented yet).

### 5. Baseline Test & Build Status
- **Scripts available:** None (no `package.json` present).
- **Executed checks:**
  - Environment detection: Node.js `v22.21.0`, npm `11.12.1`, git `2.51.2.windows.1`.
  - Directory contents: Verified read-only state.
  - Baseline lint/typecheck/build/unit tests: Not run because no `package.json` exists.

### 6. Architecture & Framework Findings
- Monolith architecture planned using Next.js App Router, Route Handlers, TypeScript, Tailwind CSS, MongoDB Atlas with Mongoose or MongoDB Node.js driver, and Zod.
- Follows domain-driven layer structure: Route Handler -> Validation -> Service -> Repository -> Database.
- Strict isolation of AI: AI acts only as a filter interpreter, never generating medical or provider facts.

### 7. Security & Configuration Findings
- **Git root misconfiguration:** `git status` reports top-level as `C:/Users/soumy`. The workspace `DocNearby` lacks an isolated `.git` repository, which risks accidental tracking or commit of personal home directory files. Initializing a dedicated git repo inside `c:\Users\soumy\OneDrive\Desktop\DocNearby` with a robust `.gitignore` is strongly recommended.
- **OneDrive sync location:** The workspace is located in `OneDrive\Desktop\DocNearby`. OneDrive background file sync can occasionally lock `node_modules` or `.next` cache files during builds. It is important to exclude build artifacts and `node_modules` appropriately.
- **Server-side secrets:** AI and database credentials must remain strictly server-side. A `.env.example` template is required before any credentials are used.

### 8. Dependency Risks
- Next.js 14/15 on Node.js v22.21.0: Ensure compatibility with Next.js App Router, React 19 / 18, and Auth.js / NextAuth.
- MongoDB Atlas: Geospatial indexes (`2dsphere`) must be created on facility coordinates.
- External mapping and AI APIs: Must handle rate limiting, timeouts, and network failure gracefully with offline/manual fallbacks.

### 9. Recommended Implementation Sequence
1. Obtain CC-00 audit approval from user.
2. Initialize local git repository in `DocNearby` and create `.gitignore`.
3. Scaffold Next.js App Router project with TypeScript strict mode, Tailwind CSS, and testing infrastructure (Vitest, React Testing Library).
4. Implement **CC-01**:
   - Public responsive healthcare search UI with location, specialty, language, and fee filters.
   - Provider result cards and detail views with verification status and price freshness labels.
   - Domain service and repository layer with demo/mock provider data (clearly marked).
   - Server-side optional AI filter-extraction route with Zod validation.
   - Resilient manual search fallback when AI is unavailable.
   - Unit and integration tests for search, filtering, and validation.

---

## Checkpoint CC-01 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Local Git Repository Isolation:** Executed `git init` directly inside `c:\Users\soumy\OneDrive\Desktop\DocNearby` and created `.gitignore`, eliminating the repository leak to the user home folder.
- **Frontend Scaffolding:** Configured Next.js 14 App Router, TypeScript strict mode, Tailwind CSS with DocNearby theme palette (teal/navy/slate), and Lucide icons.
- **Client & Search UI (`app/page.tsx`):**
  - Responsive search interface with real-time feedback.
  - Natural Language AI Assistant (`AiSearchBox.tsx`) with structured intent extraction, query chips, loading spinner, and clear fallback notices.
  - Manual filter bar (`FilterBar.tsx`) supporting City/Locality, Specialty, Language, Max Consultation Fee, and Facility Type.
  - Provider result cards (`ProviderCard.tsx`) showing verified status badges, clear demonstration badges (`isDemonstration: true`), consultation fees, source tags, freshness timestamps, and facility locations.
  - Honest empty state when no providers match; error state with retry button; loading skeletons.
  - Mandatory healthcare safety notice and emergency guidance banner (`112` / `102` in India).
- **Provider Details Screen (`app/providers/[id]/page.tsx` & `ProviderDetailsView.tsx`):**
  - Full profile displaying verified credentials, medical council registration reference, evidence audit details, operating hours, accessibility attributes, and itemized consultation pricing schedule.
- **Server-Side API & Domain Layer ("Backend"):**
  - `GET /api/v1/providers`: Query parameter validation via Zod, bounded pagination, multi-criteria filtering.
  - `GET /api/v1/providers/[id]`: Single provider fetch with 404 handling and safe data projection.
  - `GET /api/v1/metadata`: Supported cities, specialties, and languages.
  - `POST /api/v1/ai/search-intent`: Server-side Gemini API integration with strict Zod validation schema, request size limits, timeout handling, and deterministic heuristic fallback parser for offline/unconfigured environments.
  - `ProviderService` & `MemoryProviderRepository`: Clean layered separation of concerns.
- **Demonstration Dataset (`lib/data/mock-providers.ts`):**
  - 5 realistic demonstration healthcare providers clearly flagged with `isDemonstration: true` per healthcare trust rules.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/ai-search-service.test.ts` (4 tests) — PASSED
  - `tests/provider-service.test.ts` (11 tests) — PASSED
  - `tests/utils.test.ts` (4 tests) — PASSED
  - **Total:** 19 passed across 3 test suites in 9.85s.
- **TypeScript Strict Check (`npm run typecheck`):**
  - Zero errors reported.
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; static and dynamic routes generated (`/`, `/providers/[id]`, `/api/v1/providers`, `/api/v1/providers/[id]`, `/api/v1/ai/search-intent`, `/api/v1/metadata`).

---

## Checkpoint CC-02 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Cryptographic Security (`lib/auth/security.ts`):**
  - Salted password hashing with unique 16-byte random salts via Node.js `scrypt`.
  - Constant-time password verification via `crypto.timingSafeEqual` preventing timing-attack vectors.
  - Tamper-proof HMAC-SHA256 session token signing and verification with expiration timestamps.
- **Session Management (`lib/auth/get-session.ts`):**
  - Secure `httpOnly`, `sameSite: lax`, `path: /` session cookies (`docnearby_session`) and `Authorization: Bearer <token>` fallback support.
- **Domain Services & Repository (`lib/repositories/user-repository.ts`, `lib/services/auth-service.ts`):**
  - User registration with duplicate email rejection and password complexity validation (min 8 characters, letters & numbers).
  - User authentication and login credential verification.
  - Role-based separation (`traveler`, `provider`, `admin`).
  - Saved providers ("Favorites") repository with automatic provider snapshot storage.
  - **Strict Object-Level Authorization:** Saved providers are queried and deleted with explicit user ownership enforcement (`userId === record.userId`). User A cannot access or delete User B's saved providers.
- **API Route Handlers:**
  - `POST /api/v1/auth/register`: Account registration with automatic cookie issuance.
  - `POST /api/v1/auth/login`: Credential validation and session token cookie setting.
  - `POST /api/v1/auth/logout`: Safe cookie invalidation.
  - `GET /api/v1/auth/me`: Safe current user profile retrieval.
  - `PATCH /api/v1/user/profile`: Protected profile preferences update.
  - `GET /api/v1/user/saved-providers`: Protected user-specific saved providers list.
  - `POST /api/v1/user/saved-providers`: Protected provider bookmarking.
  - `DELETE /api/v1/user/saved-providers/[id]`: Protected unbookmarking with object-level ownership check.
- **Client Interfaces:**
  - `app/login/page.tsx`: Accessible sign-in form with error handling and redirect to account.
  - `app/register/page.tsx`: Account creation form with language preferences.
  - `app/account/page.tsx`: Tabbed account portal displaying saved providers with deletion controls, profile settings, and sign-out.
  - `components/layout/Header.tsx`: Dynamic session state displaying user avatar and account link when logged in, or Sign In / Register when unauthenticated.
  - `components/providers/SaveProviderButton.tsx`: Interactive bookmarking button integrated on provider cards and details views.
- **Public Discovery Integrity:**
  - Public provider search remains 100% accessible to all users without requiring login or registration.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/object-level-auth.test.ts` (6 tests) — PASSED (Verifies cross-user isolation and tampering prevention).
  - `tests/auth-service.test.ts` (9 tests) — PASSED (Verifies password hashing, tampered token rejection, registration, and login).
  - `tests/ai-search-service.test.ts` (4 tests) — PASSED
  - `tests/provider-service.test.ts` (11 tests) — PASSED
  - `tests/utils.test.ts` (4 tests) — PASSED
  - **Total:** 34 passed across 5 test suites in 4.62s.
- **TypeScript Strict Check (`npm run typecheck`):**
  - Clean compilation with 0 errors.
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; 16 static and dynamic routes generated including all new auth routes and account pages.

---

## Unified Client/Server Architecture Reorganization (Completed 2026-10-16)

### 1. Structural Reorganization Details
- **`client/` (Frontend Layer):**
  - `client/components/layout/`: `Header.tsx`, `Footer.tsx`
  - `client/components/providers/`: `ProviderCard.tsx`, `ProviderDetailsView.tsx`, `SaveProviderButton.tsx`
  - `client/components/search/`: `AiSearchBox.tsx`, `FilterBar.tsx`
  - `client/views/`: `HomePageView.tsx`, `LoginPageView.tsx`, `RegisterPageView.tsx`, `AccountPageView.tsx`, `ProviderNotFoundView.tsx`
- **`server/` (Backend Layer):**
  - `server/api/`: Reusable, testable Route Handler implementations (`providers.ts`, `provider-details.ts`, `metadata.ts`, `ai-search-intent.ts`, `auth-login.ts`, `auth-logout.ts`, `auth-me.ts`, `auth-register.ts`, `user-profile.ts`, `user-saved-providers.ts`)
  - `server/auth/`: Cryptographic hashing, timing-safe equality, token signing (`security.ts`), session resolution (`get-session.ts`)
  - `server/data/`: Demonstration mock dataset (`mock-providers.ts`)
  - `server/repositories/`: Data access layer with object-level authorization (`provider-repository.ts`, `user-repository.ts`)
  - `server/services/`: Domain business logic (`provider-service.ts`, `ai-search-service.ts`, `auth-service.ts`)
  - `server/validation/`: Zod schemas for query parameters, auth inputs, and AI search intent (`search.ts`, `auth.ts`)
- **`shared/` (Shared Types & Utilities):**
  - `shared/types/`: Domain types (`provider.ts`, `auth.ts`)
  - `shared/utils/`: Formatting and badge utilities (`formatters.ts`)
- **`app/` (Next.js Thin Routing Entrypoints):**
  - All page and API routes act as lightweight adapters delegating directly to `@/client/views` and `@/server/api`, preserving 100% Next.js App Router route hierarchy and zero-CORS full-stack deployment.
- **Superseded Directories Removed:**
  - `components/` and `lib/` safely deleted with all code migrated.

### 2. Actual Test & Build Verification Results
- **TypeScript Strict Check (`npm run typecheck`):** Passed with 0 errors.
- **Vitest Unit/Integration Tests (`npm test`):** 34 tests passed across 5 test suites (100% passing).
- **Next.js Production Build (`npm run build`):** 16 routes compiled successfully without warnings or errors.

---

## Checkpoint CC-03 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Provider & Statutory Verification Data Model (`shared/types/provider.ts`):**
  - Expanded `Provider` model with facilities, services, public contact, `verificationStatus` (`verified`, `verification_pending`, `unverified`, `suspended`), `verificationSummary`, and `verificationDetail`.
  - Added confidential `PrivateVerificationRecord` storing internal audit notes, license numbers, document storage references, reviewer user ID, and review timestamps.
  - Added `ProviderSubmission` model capturing applicant identity, role, facility details, registration references, and review state (`pending_review`, `approved`, `rejected`, `requires_correction`).
  - Added `AdminVerificationAction` for audit-logged approvals, corrections, and rejections.
- **Strict Public vs. Private Field Separation:**
  - Implemented automatic sanitization in `server/repositories/provider-repository.ts` and `server/services/provider-service.ts`.
  - `findProviders()` and default `getProviderById(id, includePrivate = false)` strictly strip out `privateVerificationRecord` from all public API and UI responses.
  - Confidential audit notes and internal investigator references are accessible only in authenticated administrative contexts.
- **Provider Onboarding Submission (`server/validation/provider-application.ts`, `server/api/provider-apply.ts`):**
  - Zod validation for applicant identity, practice details, medical council registration number, issuing authority, spoken languages, and consultation fees.
  - User-facing application portal (`client/views/ProviderApplyPageView.tsx`, `app/providers/apply/page.tsx`) with real-time feedback and review notices.
- **Admin Review & Evidence Governance (`server/api/admin-submissions.ts`, `server/api/admin-review-submission.ts`):**
  - Restricted to users with `role: 'admin'` (RBAC enforced).
  - Admin verification dashboard (`client/views/AdminVerificationPageView.tsx`, `app/admin/verification/page.tsx`) allowing Trust Operations personnel to audit credentials, log what was checked in the official register, and approve, request corrections, or reject.
  - Approval automatically publishes the active provider into the public directory with an authentic verified badge.
- **Suspension and Reinstatement Governance (`server/api/admin-suspend-provider.ts`):**
  - Provides administrators the capability to immediately suspend disputed or flagged listings with recorded reasons, and reinstate upon confirmed re-verification.
- **Navigation Enhancements (`client/components/layout/Header.tsx`):**
  - Added "List Practice" quick link and dynamic "Admin Review" portal link for authenticated administrators.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/provider-verification.test.ts` (8 tests) — PASSED (Verifies application validation, approval into public directory, strict public/private field omission, rejection audit logs, and suspension/reinstatement lifecycle).
  - `tests/auth-service.test.ts` (9 tests) — PASSED
  - `tests/object-level-auth.test.ts` (6 tests) — PASSED
  - `tests/provider-service.test.ts` (11 tests) — PASSED
  - `tests/ai-search-service.test.ts` (4 tests) — PASSED
  - `tests/utils.test.ts` (4 tests) — PASSED
  - **Total:** 42 passed across 6 test suites in 3.07s (100% passing).
- **TypeScript Strict Check (`npm run typecheck`):**
  - Zero errors reported (`tsc --noEmit` exited with code 0).
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; 20 static and dynamic routes generated including all new provider application and admin verification endpoints.

---

## Checkpoint CC-04 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Mapping Provider Evaluation & Architectural Baseline (`DocNearby_Project_Docs/MAPS_EVALUATION.md`):**
  - Conducted licensing, cost, privacy, and offline fallback review comparing Leaflet / OpenStreetMap vs. Google Maps Platform vs. Mapbox.
  - Selected OpenStreetMap embedded tiles for interactive UI, combined with universal web intent navigation URLs (`https://www.google.com/maps/dir/?api=1&destination=LAT,LON`) for free, native device app GPS turn-by-turn routing without external API costs or tracking script injection.
- **Geospatial Utilities & Validation (`shared/utils/geo.ts`, `server/validation/search.ts`, `shared/types/provider.ts`):**
  - Added geodetic Haversine calculation: `calculateHaversineDistanceKm()` computing distance in kilometers.
  - Added coordinate validation `isValidCoordinate()` ensuring latitude is within [-90, 90] and longitude within [-180, 180].
  - Added human-readable distance formatter: `formatDistance()` (e.g. "450 m away", "2.4 km away").
  - Extended `searchQuerySchema` with validated `latitude`, `longitude`, `radiusKm` (1-100km), and `sortBy: 'relevance' | 'distance' | 'fee_asc' | 'fee_desc'`.
  - Added `distanceKm` optional projection on `Provider` model.
- **Repository Nearby Proximity Search (`server/repositories/provider-repository.ts`):**
  - Implemented proximity distance calculation across all provider facilities in `MemoryProviderRepository`.
  - Implemented radius filtering and distance-based sorting (nearest first).
  - Implemented MongoDB `2dsphere` query support via `$geoWithin` with `$centerSphere` in `MongoProviderRepository` with seamless in-memory fallback.
  - Retained 100% strict privacy protection: `privateVerificationRecord` remains stripped in all public searches.
- **Client Geolocation Hook with Permission-Denied Fallback (`client/hooks/useGeolocation.ts`):**
  - Manages browser geolocation politely: states `idle`, `locating`, `success`, `denied`, `unavailable`, `timeout`.
  - Never auto-prompts on load; triggers exclusively on user explicit click.
  - When location permission is denied or unavailable, displays clear guidance: *"Location permission was denied. You can search by entering your city or locality manually."*
  - Manual location search is 100% operational and never blocked or gated.
- **Interactive Maps & Navigation UI:**
  - `client/components/maps/FacilityMap.tsx`: Embedded OpenStreetMap view with turn-by-turn "Get Directions" navigation button, facility hours, and verified accessibility badges (Wheelchair ramp, elevator, ground floor entrance). Fallback renders textual address and directions link if tiles fail.
  - `client/components/maps/ProviderMapView.tsx`: Directory-wide interactive map view with selectable facility pins and live preview cards.
  - `client/views/HomePageView.tsx`: Added view mode toggle ("Directory Cards" vs. "Map View"), "Near Me" GPS button, proximity radius dropdown, and Sort By selector.
  - `client/components/providers/ProviderCard.tsx`: Displays distance badge (e.g. "2.4 km away") and direct "Directions" action button.
  - `client/components/providers/ProviderDetailsView.tsx`: Integrated `FacilityMap` for each care delivery location.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/geospatial-search.test.ts` (13 tests) — PASSED (Validates coordinates bounds, Haversine accuracy, distance formatting, query schema, radius filtering, distance sorting, fee sorting, manual search integrity, and private record sanitization).
  - `tests/provider-verification.test.ts` (8 tests) — PASSED
  - `tests/auth-service.test.ts` (9 tests) — PASSED
  - `tests/object-level-auth.test.ts` (6 tests) — PASSED
  - `tests/provider-service.test.ts` (11 tests) — PASSED
  - `tests/ai-search-service.test.ts` (4 tests) — PASSED
  - `tests/utils.test.ts` (4 tests) — PASSED
  - **Total:** 55 passed across 7 test suites in 3.60s (100% passing).
- **TypeScript Strict Check (`npm run typecheck`):**
  - Clean compilation with 0 errors (`tsc --noEmit` exited with code 0).
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; 20 static and dynamic routes generated cleanly.

---

## Checkpoint CC-05 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Price Transparency & Data Invariants (`shared/types/provider.ts`, `shared/utils/formatters.ts`):**
  - Granular consultation fee metadata: amount (minor integer paise), currency (INR), price type (`confirmed`, `starting_from`, `estimate`, `unavailable`), evidence source (`clinic_verified_fee_schedule`, `reception_confirmed`, `facility_website_published`, `patient_reported_community`), and exact confirmation timestamp (`lastConfirmedAt`).
  - Stale fee detection (`checkPriceStaleness()`): Quotes older than statutory threshold (90 days) trigger an amber warning badge (`Unverified >90d`) and advisory alert to confirm with front desk reception before visiting.
  - Relative time helper (`formatRelativeTime()`).
- **Community Discrepancy Reporting Workflow (`server/validation/price-report.ts`, `server/api/provider-price-report.ts`):**
  - Zod validation for user discrepancy reports (`priceReportSubmissionSchema`): requires positive integer paise, observed date, and contextual receipt notes.
  - User submission modal dialog (`client/components/pricing/PriceReportModal.tsx`) accessible from every provider card and details page.
  - Route handler `POST /api/v1/providers/[id]/price-report` linked to thin adapter `app/api/v1/providers/[id]/price-report/route.ts`.
- **Administrative Price Audit & Directory Resolution (`server/api/admin-price-reports.ts`, `server/api/admin-resolve-price-report.ts`):**
  - Administrative dashboard (`client/views/AdminPriceReportsPageView.tsx`, `app/admin/price-reports/page.tsx`): allows Trust Operations to filter reports by status (`pending_review`, `accepted`, `dismissed`), inspect traveler receipt evidence, and execute resolutions.
  - When approved with `updateProviderPrice: true`, public directory listing price is updated, freshness timestamp reset to now, and source tagged as `patient_reported_community`.
  - Admin RBAC protected endpoints: `GET /api/v1/admin/price-reports` and `POST /api/v1/admin/price-reports/[id]/resolve`.
- **Side-by-Side Provider Comparison (`client/components/pricing/ProviderComparisonDrawer.tsx`):**
  - Floating pill trigger and modal dialog comparing consultation fees, evidence sources, freshness, statutory verification status, spoken languages, and physical accessibility for up to 3 providers simultaneously.
  - Integrated into `HomePageView.tsx` with compare toggles on `ProviderCard.tsx`.
- **Navigation Integration (`client/components/layout/Header.tsx`):**
  - Added dedicated "Price Reports" quick link for administrators alongside "Verifications".

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/transparent-pricing.test.ts` (21 tests) — PASSED (Fresh vs stale boundaries, custom thresholds, schema validation, submission workflow, admin dismissal, admin acceptance with directory update, fee filter, fee ascending/descending sorting).
  - All 8 test suites passed: 76/76 tests passed in 4.18s (100% passing).
- **TypeScript Strict Check (`npm run typecheck`):**
  - Zero errors reported (`tsc --noEmit` exited with code 0).
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; 22 static and dynamic routes generated cleanly including `/admin/price-reports` and all pricing API routes.

---

## Checkpoint CC-06 Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Appointment Request & Confirmation State Machine (`shared/types/appointment.ts`, `shared/utils/formatters.ts`):**
  - Seven-state lifecycle: `requested`, `confirmed`, `rescheduled`, `cancelled_by_patient`, `cancelled_by_provider`, `completed`, `no_show`.
  - Initial state invariant: all booking requests enter `requested` status; never auto-confirmed upon creation.
  - Distinct status badges via `getAppointmentStatusBadge()`, visually distinguishing unconfirmed requests (sky-blue) from official provider confirmations (emerald).
- **Validation Schemas (`server/validation/appointment.ts`):**
  - `createAppointmentSchema` enforcing future booking dates, valid email, phone, and optional patient intake notes.
  - `updateAppointmentStatusSchema` and `rescheduleAppointmentSchema` enforcing transition rules and required reasons.
- **Retry-Safe Idempotent Notifications (`server/services/notification-service.ts`):**
  - Generates deterministic idempotency keys (`notif-${appointmentId}-${eventType}-v${attempt}`) preventing duplicate email/SMS dispatch.
  - Copy clearly communicates status (e.g. `[REQUEST SUBMITTED] (Pending Confirmation)` vs `[CONFIRMED]`).
- **Object-Level Authorization & Service (`server/services/appointment-service.ts`):**
  - Patients can only view and cancel their own appointments (`403 Forbidden` on unauthorized access).
  - Providers and administrators can confirm, decline, or complete appointments.
  - Mutation of terminal states (`cancelled`, `completed`, `no_show`) is strictly blocked.
- **Repository Layer (`server/repositories/appointment-repository.ts`):**
  - `MemoryAppointmentRepository` seeded with sample appointments demonstrating all states.
  - `MongoAppointmentRepository` supporting MongoDB Atlas persistence with seamless fallback.
- **Client User Interface:**
  - `BookAppointmentModal.tsx`: Booking dialog accessible from provider profiles and consultation tables.
  - `AppointmentsPageView.tsx` & `/appointments`: Traveler care portal with status filter tabs, cancellation workflow, timeline audit trail, and notification logs.
  - `Header.tsx`: Added "Appointments" quick link for authenticated users.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/appointment-service.test.ts` (14 tests) — PASSED (Covers initial state invariant, past date rejection, provider confirmation, patient cancellation, terminal state lock, object-level authorization, and notification idempotency).
  - All 9 test suites passed: 90/90 tests passed in 4.20s (100% passing).
- **TypeScript Strict Check (`npm run typecheck`):**
  - Zero errors reported (`tsc --noEmit` exited with code 0).
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; 24 static and dynamic routes generated cleanly including `/appointments` and all appointment API routes.

---

## Google Maps & Google Places Healthcare Discovery Evidence Log (Completed 2026-10-16)

### 1. Implemented Capabilities
- **Google Places API (New) Client (`server/services/google-places-service.ts`):**
  - Integrated official modern Places API with explicit field masks: `places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.rating,places.userRatingCount,places.types,places.googleMapsUri`.
  - In-memory cache with 10-minute TTL for repeated location and query searches.
  - AbortController timeout protection (5000ms).
  - Robust sanitization stripping `<script>`, `<style>`, and HTML control characters from external listings.
  - Built-in graceful degradation: returns structured `{ status: 'unconfigured' | 'unavailable' | 'error', places: [] }` without unhandled crashes.
- **Unified Healthcare Discovery Service (`server/services/unified-search-service.ts`):**
  - Parallel discovery across DocNearby MongoDB and Google Places using `Promise.allSettled()`.
  - Normalizes results into standardized `UnifiedHealthcareListing`.
  - Computes geodetic Haversine distances when coordinates are provided; enforces bounded radius filtering (0.5 to 50 km).
  - Fault isolation: Google Places API outages never impact DocNearby provider discovery; MongoDB issues never block Google Places discovery.
- **Strict Invariants Preserved:**
  - **Source Attribution:** Unambiguous distinction between `"Registered on DocNearby"` (Teal) and `"Google-listed"` (Indigo).
  - **Verification Separation:** External Google listings strictly assigned `"not_verified_by_docnearby"` with clear explanatory tooltips.
  - **Booking Invariant (CC-06):** External Google listings have `booking.isAvailable = false`; attempting to create an appointment against a Google Place ID alone is rejected on the server.
  - **Transparent Pricing (CC-05):** Confirmed fees displayed for DocNearby providers; Google Places listings display `"Fee not verified by DocNearby"` with zero fabricated fees.
- **Client Components & Dedicated Discovery Page:**
  - `client/components/maps/GoogleDiscoveryMap.tsx`: Responsive interactive map with custom dual-source markers (Teal/Indigo), InfoWindow popovers, "Fit All" bounds button, and seamless fallback to OpenStreetMap if client API key is unconfigured.
  - `client/components/discovery/UnifiedResultCard.tsx`: Unified result card displaying source badges, verification badges, transparent pricing, directions link, and direct slot booking for DocNearby providers.
  - `client/views/DiscoveryPageView.tsx` & `/discovery`: Full discovery page with GPS geolocation ("Near Me"), radius selection, source filters, sorting controls, responsive layout toggle (Split View / Cards / Map), and CC-06 appointment modal integration.
  - Navigation updates: Added "Map Discovery" link to `Header.tsx` and feature banner on `HomePageView.tsx`.
- **Zod Validation & Route Handler:**
  - `server/validation/unified-search.ts`: Validates `latitude`, `longitude`, `radiusKm` (0.5..50), `source`, `sortBy`, `limit`.
  - `app/api/v1/search/places/route.ts`: Thin route handler returning unified JSON payload.

### 2. Actual Test & Build Results
- **Vitest Unit/Integration Tests (`npm test`):**
  - `tests/google-places-integration.test.ts` (17 tests) — PASSED (Covers coordinate validation, radius bounds, query limits, Places adapter, sanitization, in-memory caching, unified search combining sources, source ID preservation, verification separation, booking invariant, pricing invariant, appointment guard against Google Place IDs, and independent fault isolation).
  - All 10 test suites passed: **107/107 tests passed** (100% passing).
- **TypeScript Strict Check (`npm run typecheck`):**
  - Zero errors reported (`tsc --noEmit` clean exit code 0).
- **Next.js Production Build (`npm run build`):**
  - Compiled successfully; **26 static and dynamic routes** generated cleanly including `/discovery` and `/api/v1/search/places`.

---

## Required evidence for each update
Record:
- Date and checkpoint
- Files changed
- Commands actually run
- Test/build outputs
- Acceptance criteria passed/failed
- Known risks and blockers
- User review comments and approval
- Deployment/push authorization if relevant

Never mark a feature `VERIFIED` based solely on code generation or an AI agent's assertion.


