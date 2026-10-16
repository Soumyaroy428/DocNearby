# DocNearby — Product Requirements Document

**Version:** 1.0 | **Status:** Proposed | **Market:** Initial pilot in one city in India

## 1. Summary
DocNearby helps travelers discover doctors, clinics, hospitals, and diagnostic facilities in unfamiliar cities. It provides location-aware search, specialty and language filters, transparent price information, evidence-based verification labels, directions, appointment requests, and optional AI-assisted search.

## 2. Problem
Travelers may not know which facilities are appropriate, which providers speak their language, what consultation costs, or whether information is current. Search results and ratings alone do not prove professional credentials or clinical quality.

## 3. Goals
- Reduce time required to find a relevant provider.
- Show the source, status, and freshness of provider and price information.
- Help users filter by location, specialty, language, and available cost data.
- Support appointment/contact actions when genuinely available.
- Protect privacy and make manual search reliable without AI.
- Establish a trustworthy pilot before expanding cities.

## 4. Non-goals for MVP
- Autonomous diagnosis or treatment recommendations.
- AI-generated prescriptions.
- Emergency dispatch.
- Guaranteeing clinical quality or treatment outcomes.
- Guaranteed final treatment costs.
- Nationwide listings without verification processes.
- Insurance claims or payment processing unless separately approved.

## 5. Personas
- International tourist needing language-compatible care.
- Domestic traveler unfamiliar with local facilities.
- Family/caregiver searching for an appropriate specialty.
- Provider/clinic manager maintaining profile information.
- Verification administrator reviewing provider evidence.

## 6. Functional requirements
### FR-01 Public search
Search without login by city/locality, provider/facility name, specialty, and language. Optional filters may include fee range and distance when supported.

### FR-02 Results
Paginated result cards display available fields, price status, verification status, location, and supported contact actions. Missing fields must be labelled, not invented.

### FR-03 Provider details
Display profile, specialty, qualifications, registration reference where verifiable, facility address, language, service fees, source and date of pricing, operating hours, and contact instructions.

### FR-04 Verification
Provider submissions enter a pending state. Authorized reviewers record evidence source, status, date, and expiry. “Verified” must specify what was verified. Support re-checks, corrections, reports, and suspension.

### FR-05 Pricing
Support confirmed price, starting-from price, estimate, and not-provided states. Store currency, source, last-confirmed timestamp, and exclusions when known.

### FR-06 Location
Support optional browser location and manual city/address selection. Permission denial must not block search. Use mapping services subject to licensing and cost review.

### FR-07 Accounts
Optional accounts support saved providers, appointment requests, preferences, and account/data controls. Public provider search does not require registration.

### FR-08 Appointments
Support request and provider-confirmed states, cancellation, rescheduling, and safe notifications. A request must never be shown as confirmed until confirmation is received.

### FR-09 AI-assisted search
Convert natural language to validated, supported filters and call the same provider-search service as manual search. If AI fails or is unconfigured, manual search remains available.

### FR-10 Reviews
If implemented, reviews require abuse controls, moderation, reporting, and clear distinction from credential verification.

### FR-11 Administration
Manage provider applications, verification records, pricing, complaints, user reports, taxonomy, and audit events with role-based access.

### FR-12 Privacy and support
Provide privacy notice, terms, medical disclaimer, contact/support path, and appropriate data export/deletion workflows.

## 7. Non-functional requirements
- Mobile-first responsive interface.
- TypeScript strict mode and server-side validation.
- Authentication and object-level authorization for private data.
- Rate limiting, safe errors, audit logging, and secret management.
- Bounded pagination and indexed queries.
- Accessible keyboard and screen-reader interactions.
- Monitoring, backups, and recovery procedures before production.
- Defined performance targets based on load tests, not assumptions.

## 8. Success metrics
Measure search-to-profile time, result relevance, percentage of profiles with current verification, percentage with current prices, contact/appointment conversion, correction reports, user satisfaction, latency, error rate, and security incidents. Set targets after a pilot baseline.

## 9. Risks
- Incorrect or stale provider records.
- Prices that exclude additional services.
- Fake reviews or fraudulent listings.
- AI hallucinations or unsafe interpretation.
- Sensitive-data leakage.
- Third-party API outages and costs.
- Low provider coverage.

Mitigate with evidence sources, timestamps, moderation, safe fallbacks, minimum data collection, monitoring, and a city-by-city rollout.

## 10. MVP release criteria
- Manual search and filters work.
- Provider details and missing-data states are honest.
- Verification and pricing labels are evidence-based.
- AI is optional and constrained to validated search filters.
- Authorization and privacy tests pass.
- Mobile/accessibility checks pass.
- Known risks, provider sources, and operational ownership are documented.
