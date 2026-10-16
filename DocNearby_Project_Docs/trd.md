# DocNearby — Technical Requirements Document (TRD)

**Version:** 1.0 | **Status:** Proposed; validate against repository before implementation.

## 1. Purpose
Translate the product requirements into technical contracts, data structures, API behavior, security controls, testing, and deployment expectations.

## 2. Proposed stack
- Next.js App Router, React, TypeScript strict mode
- Tailwind CSS and accessible UI primitives
- Next.js Route Handlers for API endpoints
- MongoDB Atlas; MongoDB driver or Mongoose
- Zod for input and AI-output validation
- Auth.js or a selected managed authentication provider
- Vitest, React Testing Library, Playwright
- Vercel candidate for hosting; GitHub CI
- One approved mapping provider; optional AI provider

Versions must be selected based on compatibility and maintained release status at implementation time. Do not hardcode outdated versions from this document.

## 3. Runtime environments
- Development: local database or isolated development database and non-production credentials.
- Test: isolated data and mock integrations.
- Staging: production-like configuration without real user data unless explicitly approved.
- Production: least-privilege credentials, monitoring, backups, access controls, and reviewed policies.

Use environment variables and deployment secret storage. Commit only `.env.example` with placeholder names, never actual secrets.

## 4. Domain model

### Provider
- `id`
- `displayName`
- `providerType` (doctor, clinic, hospital, diagnostic facility)
- `specialtyIds[]`
- `languageClaims[]`
- `registrationReference` (only when applicable)
- `verificationStatus`
- `verificationSummary`
- `facilityIds[]`
- `publicContact`
- `createdAt`, `updatedAt`

### Facility
- `id`, `name`, `address`, `city`, `region`, `country`
- `location` as GeoJSON Point when coordinates are verified
- `publicPhone`, `website`, `hours`
- `accessibilityAttributes[]`
- timestamps

### ServicePrice
- `id`, `providerId` or `facilityId`
- `serviceName`
- `amountMinor` integer (e.g. paise for INR)
- `currency` ISO currency code
- `priceType` (confirmed, starting_from, estimate)
- `sourceType`, `sourceReference`
- `lastConfirmedAt`
- `validUntil` when available
- `notes`/exclusions when known

### VerificationRecord
- `providerId`
- `evidenceType`, `source`, `checkedBy`
- `status`, `checkedAt`, `expiresAt`
- private evidence reference stored separately from public profile data

### Appointment
- `id`, `userId`, `providerId`/`facilityId`
- `requestedStart`, `timezone`
- `status` (requested, confirmed, rescheduled, cancelled, completed, rejected)
- minimal contact details, timestamps
- idempotency key where relevant

### User
- authentication subject/reference
- role, preferred language, account status
- minimal profile fields required for features

Additional collections (reviews, notifications, audit logs, saved providers) should be introduced when their checkpoints are approved.

## 5. API conventions
Use `/api/v1` for application APIs. Responses should use a consistent JSON envelope, for example:
```json
{
  "data": {},
  "error": null,
  "meta": {}
}
```
Do not expose stack traces, secrets, database errors, or private verification evidence.

Proposed endpoints:
- `GET /api/v1/providers` — public, validated filters and bounded pagination
- `GET /api/v1/providers/:id` — public profile with only public fields
- `GET /api/v1/specialties` — supported specialty list
- `POST /api/v1/appointments` — authenticated request, if implemented
- `GET /api/v1/appointments` — authenticated user's appointments
- `PATCH /api/v1/appointments/:id` — authorized state changes
- `POST /api/v1/providers/applications` — provider application, if implemented
- `POST /api/v1/ai/search-intent` — optional AI filter extraction

Admin endpoints require role checks and audit records. Exact route conventions should match the existing codebase.

## 6. Search contract
Allowed filters must be explicitly enumerated, validated, and normalized. Use bounded pagination (for example, a default page size of 20 and a hard maximum of 100, adjusted after testing). Sort only by allowlisted fields. Never accept arbitrary MongoDB operators from request input.

Geospatial search requires a correctly indexed GeoJSON location and validated coordinates. Manual city search must remain available without geolocation permission.

## 7. AI search contract
AI returns a constrained structure only:
```json
{
  "location": "Kolkata",
  "specialty": "Dermatology",
  "languages": ["English"],
  "maxFeeMinor": 100000,
  "currency": "INR"
}
```
The amount above represents ₹1,000 when stored in paise. Validate and normalize output with Zod. Unsupported values must be rejected or ignored according to an explicit policy. The AI route must invoke the same provider-search service as manual search; it must not return fabricated provider records.

AI endpoint controls: server-only credentials, timeout, request-size cap, rate limiting, safe errors, minimal prompt data, no unrestricted DB access. AI is optional.

## 8. Security requirements
- HTTPS in production.
- Authentication for private operations.
- Authorization on every record-level operation.
- RBAC for provider/admin actions.
- Input validation, output encoding, and safe query construction.
- Rate limiting and abuse controls.
- Least-privilege database access.
- Secure cookies/session settings.
- Private verification evidence not publicly accessible.
- Redacted logs and restricted audit-log access.
- Backup and restore testing.
- Data retention/deletion workflow.
- Dependency and secret scanning.
- Review applicable privacy and healthcare obligations before launch.

## 9. Indexing and performance
Candidate indexes, to be confirmed with real queries:
- Provider `verificationStatus`, `specialtyIds`, and normalized location fields.
- Facility `location` as `2dsphere` where used.
- Service price `providerId/facilityId`, `serviceName`, and freshness fields.
- Appointment `userId`, `providerId`, `requestedStart`, and `status`.
- Unique constraints for identifiers where appropriate.

Use query profiling before adding indexes. Avoid returning unbounded documents or sensitive fields.

## 10. Observability
Record request correlation IDs, latency, status, and operational errors without unnecessary personal or health details. Monitor API latency, error rate, database connections, third-party failures, AI latency/cost, and background-job failures if introduced.

## 11. Testing requirements
- Unit tests for validation and business rules.
- API integration tests for filters, pagination, permissions, and safe errors.
- Tests proving users cannot access other users' private records.
- AI malformed output, timeout, and disabled-provider tests.
- Tests for price/verification freshness labels.
- Playwright user flows for search, profile, and appointment request.
- Accessibility and responsive checks.
- Build/lint/type checks and dependency/security scans.

## 12. Deployment and rollback
Use CI to run lint, type checks, tests, and production build. Deploy to staging, run smoke tests, inspect monitoring, and document rollback. Production deployment is a separately approved action. Never claim success without the actual deployment result.

## 13. Open technical decisions
- Final product name and initial launch city.
- Authentication provider.
- Mapping provider and pricing/licensing.
- AI model/provider and data-processing terms.
- Provider credential verification sources and process.
- Appointment booking integration versus request-only MVP.
- Data retention policy and legal review.
- Hosting region, backup targets, and operational service-level objectives.
