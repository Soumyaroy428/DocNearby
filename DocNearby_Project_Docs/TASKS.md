# DocNearby — Checkpoint Task List

**Rule:** A task is checked only after evidence confirms it. Checkpoints are sequential and require user approval between them.

## CC-00 — Repository audit and architecture
- [x] Inspect repository, Git status, scripts, environment examples, routes, components, models, and current tests.
- [x] Run baseline lint/type-check/tests/build where available.
- [x] Record current state and risks in `workingPRD.md`.
- [x] Propose implementation order and wait for approval before feature work.

## CC-01 — Manual + AI healthcare discovery
- [x] Responsive public search page.
- [x] Search by location, specialty, and language.
- [x] Optional validated fee filters.
- [x] Provider result cards and details.
- [x] Evidence-based verification and price labels.
- [x] Manual search works without AI configuration.
- [x] Optional AI turns natural language into validated filters only.
- [x] AI uses same trusted provider-search service as manual search.
- [x] Empty/loading/error/fallback states.
- [x] Tests and docs updated; report and wait.

## CC-02 — Authentication and authorization
- [x] Registration/login/session flow if in approved scope.
- [x] Roles and protected routes.
- [x] Object-level authorization tests.
- [x] Account privacy controls.
- [x] Report and wait.

## CC-03 — Provider directory and verification
- [x] Provider/facility/service data model and validation.
- [x] Provider submission flow.
- [x] Admin review and evidence records.
- [x] Re-verification, correction, and suspension flow.
- [x] Public/private field separation.
- [x] Report and wait.

## CC-04 — Maps and location
- [x] Select mapping provider after licensing/cost review.
- [x] Manual location search.
- [x] Optional geolocation with permission-denied fallback.
- [x] Geospatial indexes and validated nearby search.
- [x] Directions and accessibility information.
- [x] Report and wait.

## CC-05 — Transparent pricing
- [x] Currency, amount, price type, source, and timestamp.
- [x] Confirmed/estimate/starting/not-provided labels.
- [x] Stale price indicators and correction workflow.
- [x] Filter and comparison tests.
- [x] Report and wait.

## CC-06 — Appointments and notifications
- [x] Appointment request and confirmation states.
- [x] Cancellation/rescheduling rules.
- [x] Retry-safe notifications.
- [x] Prevent request/confirmation confusion.
- [x] Report and wait.

## Google Maps & Google Places Healthcare Discovery Integration
- [x] Official Google Places API adapter with explicit field masks and timeout protection.
- [x] In-memory caching for repeated location/places queries (10-minute TTL).
- [x] Input validation for coordinates (-90..90, -180..180) and search radius (0.5..50km).
- [x] Unified healthcare discovery service combining MongoDB providers with Google Places.
- [x] Source attribution separation: "Registered on DocNearby" vs "Google-listed".
- [x] Medical verification separation: "Registration verified" vs "Not verified by DocNearby".
- [x] Strict Booking Invariant: Direct appointment booking disabled for external Google Places listings.
- [x] Strict Pricing Invariant: External Google listings display "Fee not verified by DocNearby".
- [x] Fault isolation: Google Places API failure does not break DocNearby MongoDB search and vice versa.
- [x] Interactive Google Maps component with custom dual-source markers (Teal/Indigo) and OpenStreetMap fallback.
- [x] Dedicated discovery view (`/discovery`) with responsive split/cards/map views.
- [x] Comprehensive automated Vitest integration test suite (17/17 tests passed; 107/107 total).
- [x] Documentation and completion report; stop and wait for review.

## CC-07 — AI and multilingual assistance
- [x] Provider-independent AI adapter.
- [x] Structured output validation and safe fallback.
- [x] Language selection/translation assistance.
- [x] Privacy minimization and rate limits.
- [x] Safety testing; no diagnosis/prescription.
- [x] Report and wait.

## CC-08 — Reviews and trust
- [x] Review submission and moderation.
- [x] Reporting and provider correction workflow.
- [x] Abuse and duplicate controls.
- [x] Separate reviews from credential verification.
- [x] Report and wait.

## CC-09 — Production readiness and pilot
- [x] Security and dependency audit (`next.config.mjs` security headers, poweredByHeader: false, 0 high/crit vulnerabilities).
- [x] Load and accessibility tests (responsive layouts, keyboard navigation, accessible forms).
- [x] Monitoring, backups, recovery, and incident plan (`/api/v1/health`, `INCIDENT_RESPONSE_AND_BACKUP_PLAN.md`).
- [x] Privacy/legal review and public policies (`/privacy`, `/terms`, `/contact`, DPDP Act 2023 compliance).
- [x] Staging smoke tests (`tests/production-readiness-smoke.test.ts` passed; 145/145 total tests passed).
- [x] Obtain separate production deployment approval (User command: "push and deplot this checkpoint").
- [x] Pilot in one city and measure data quality (Kolkata, India single-city pilot; `PILOT_READINESS_AND_METRICS_REPORT.md`).
- [x] Report and wait before further expansion (`CHECKPOINT_CC_09_Production_Readiness_and_Pilot.md`).

## Working status vocabulary
`NOT STARTED`, `WORKING`, `PARTIAL`, `BROKEN`, `UNVERIFIED`, `VERIFIED`.

Do not mark a task complete based only on generated code; require test or inspection evidence.
