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
- [ ] Currency, amount, price type, source, and timestamp.
- [ ] Confirmed/estimate/starting/not-provided labels.
- [ ] Stale price indicators and correction workflow.
- [ ] Filter and comparison tests.
- [ ] Report and wait.

## CC-06 — Appointments and notifications
- [ ] Appointment request and confirmation states.
- [ ] Cancellation/rescheduling rules.
- [ ] Retry-safe notifications.
- [ ] Prevent request/confirmation confusion.
- [ ] Report and wait.

## CC-07 — AI and multilingual assistance
- [ ] Provider-independent AI adapter.
- [ ] Structured output validation and safe fallback.
- [ ] Language selection/translation assistance.
- [ ] Privacy minimization and rate limits.
- [ ] Safety testing; no diagnosis/prescription.
- [ ] Report and wait.

## CC-08 — Reviews and trust
- [ ] Review submission and moderation.
- [ ] Reporting and provider correction workflow.
- [ ] Abuse and duplicate controls.
- [ ] Separate reviews from credential verification.
- [ ] Report and wait.

## CC-09 — Production readiness and pilot
- [ ] Security and dependency audit.
- [ ] Load and accessibility tests.
- [ ] Monitoring, backups, recovery, and incident plan.
- [ ] Privacy/legal review and public policies.
- [ ] Staging smoke tests.
- [ ] Obtain separate production deployment approval.
- [ ] Pilot in one city and measure data quality.
- [ ] Report and wait before further expansion.

## Working status vocabulary
`NOT STARTED`, `WORKING`, `PARTIAL`, `BROKEN`, `UNVERIFIED`, `VERIFIED`.

Do not mark a task complete based only on generated code; require test or inspection evidence.
