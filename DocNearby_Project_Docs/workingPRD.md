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
