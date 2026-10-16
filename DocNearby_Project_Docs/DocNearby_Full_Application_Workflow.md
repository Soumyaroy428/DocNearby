# DocNearby — Full Application Workflow

This document describes the proposed end-to-end workflow. Verify each path against the implemented application.

## 1. Traveler discovery workflow
1. Traveler opens the public website.
2. Enters a city/locality manually or grants optional location permission.
3. Selects specialty and language; optionally applies fee and distance filters.
4. Application validates filters and queries the provider-search service.
5. Backend returns paginated results from approved provider records.
6. UI displays provider details with verification and price freshness labels.
7. Traveler opens a profile, reviews details, and calls, gets directions, or requests an appointment if supported.
8. Traveler can report inaccurate information.

## 2. Optional AI search workflow
1. Traveler enters a natural-language request.
2. Backend applies request-size and rate limits.
3. Server-side AI adapter converts the request into a constrained filter object.
4. Zod/schema validation rejects unsupported or malformed fields.
5. User can inspect or edit interpreted filters.
6. The same provider-search service used by manual search executes the query.
7. UI displays real database records only.
8. If AI is unavailable, manual search remains available with a clear message.

AI does not generate provider facts, confirm appointment availability, verify credentials, diagnose, or prescribe.

## 3. Provider onboarding workflow
1. Provider submits profile and supporting registration information.
2. System stores the application in pending status.
3. Authorized reviewer checks the supplied information against appropriate sources.
4. Reviewer records what was checked, source, result, date, and expiry if applicable.
5. Reviewer approves, rejects, or requests correction.
6. Public profile displays only approved public fields and an accurate verification label.
7. Expired or disputed verification is rechecked or marked accordingly.

## 4. Pricing update workflow
1. Provider or authorized staff submits service price and source.
2. System validates amount, currency, service, and price type.
3. Reviewer/provider process confirms the information according to policy.
4. Store source and last-confirmed timestamp.
5. Public page labels the price as confirmed, estimated, starting-from, or unavailable.
6. Stale data is flagged for review; never silently imply a stale price is current.

## 5. Appointment workflow
1. Traveler selects a provider and requests an appointment.
2. Backend checks authorization, input validity, and supported availability integration.
3. Appointment is stored as `REQUESTED`.
4. Provider or integrated booking system confirms, rejects, or proposes a new time.
5. State changes are validated and audited.
6. Notification is sent with retry-safe behavior.
7. UI displays confirmation only after an actual confirmation event.

## 6. Admin workflow
1. Admin authenticates with an authorized role.
2. Reviews provider applications, reports, price updates, and disputes.
3. Performs permitted action.
4. System validates authorization and records an audit event.
5. Public content updates only after appropriate approval.
6. Suspicious listings can be suspended pending review.

## 7. Failure paths
- No results: explain filters and allow users to broaden search.
- Location permission denied: show manual location input.
- Mapping provider unavailable: retain address and contact information.
- AI unavailable: switch to manual search.
- Stale/missing price: label honestly.
- Provider not verified: show the correct status; do not hide it behind generic trust language.
- Booking provider unavailable: offer contact/request path only if supported; do not claim a confirmed booking.
- Urgent health situation: show appropriate local emergency guidance without requiring AI or registration.

## 8. Operations workflow
- CI runs lint, type checks, tests, and build.
- Deploy to staging after checks pass.
- Run smoke and access-control tests.
- Review monitoring and errors.
- Production deploy requires separate approval.
- Each development checkpoint requires a report and explicit user approval before the next checkpoint.
