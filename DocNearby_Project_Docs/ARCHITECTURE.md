# DocNearby — Architecture

**Status:** Proposed architecture; verify against the implementation before claiming completion.

## 1. Product
DocNearby helps travelers discover healthcare providers in unfamiliar cities using provider search, evidence-based verification labels, transparent price information, location filters, language filters, and optional AI-assisted search.

## 2. Architecture decision
Start with a **modular monolith**. Use Next.js App Router and Route Handlers initially. Do not add a separate Express server, microservices, Kubernetes, or a queue until a demonstrated requirement justifies the operational complexity.

### Request flow
Browser → Next.js page/API → authentication and authorization → domain service → repository/data access → MongoDB Atlas.

External integrations are adapters: maps/geocoding, email, optional AI provider, and appointment providers.

## 3. Recommended stack
- Next.js App Router, React, TypeScript (`strict: true`)
- Tailwind CSS; accessible component library such as shadcn/ui/Radix
- Next.js Route Handlers
- MongoDB Atlas with MongoDB Node.js driver or Mongoose
- Zod for request and model-output validation
- Auth.js or an appropriately configured managed authentication provider
- Vitest, React Testing Library, Playwright
- Vercel for Next.js hosting; GitHub Actions or equivalent CI
- One mapping provider selected after cost, licensing, coverage, and privacy review
- Provider-independent server-side AI adapter, optional

## 4. Logical modules
1. Identity and access
2. Provider directory
3. Facility directory
4. Search and geospatial discovery
5. Services and pricing
6. Provider applications and verification
7. Appointment requests
8. Reviews and moderation
9. Notifications
10. AI search intent
11. Administration and audit
12. Support and privacy requests

Keep business logic out of UI components and HTTP route handlers. Route handlers validate requests, call services, and return safe responses.

## 5. Suggested folder layout
Adapt to the existing repository; do not duplicate existing modules merely to match this tree.

```text
app/
  (public)/
    page.tsx
    find/page.tsx
    providers/[id]/page.tsx
  (account)/
    account/page.tsx
    appointments/page.tsx
  admin/
  api/v1/
    providers/route.ts
    providers/[id]/route.ts
    appointments/route.ts
    ai/search-intent/route.ts
components/
  search/
  providers/
  appointments/
  ai/
  ui/
lib/
  auth/
  db/
  validation/
  repositories/
  services/
  integrations/
  security/
  observability/
models/ or schemas/
tests/
```

## 6. Data model overview
- `users`: identity reference, role, preferred language, account status
- `providers`: name, type, specialties, language claims, registration references, verification state
- `facilities`: address, GeoJSON location, contact, hours, accessibility
- `services`: provider/facility, service name, fee, currency, price type, source, confirmed date
- `appointments`: user, provider, requested slot, status, minimal contact data
- `reviews`: user, provider, rating, moderated text, status
- `verificationRecords`: evidence type, source, reviewer, status, expiry
- `notifications`: recipient, type, delivery status
- `auditLogs`: actor, action, target, timestamp, minimal metadata

Define schemas, validation, references, indexes, and retention rules before production use. Keep private evidence documents out of public profile responses.

## 7. Search
Start with indexed MongoDB queries and geospatial indexes when coordinates are available. Validate and normalize search filters; use bounded pagination and a maximum page size. Consider a dedicated search engine only after profiling shows MongoDB is insufficient.

## 8. AI boundary
AI is optional. In the first AI checkpoint, it may convert natural language into a constrained filter object only. Validate with Zod and pass filters to the same trusted provider-search service as manual search. AI must not invent provider profiles, fees, credentials, verification, opening hours, or appointment availability. Do not allow unrestricted AI database access.

## 9. Security and privacy
- Server-only secrets; no API keys in client bundles or Git.
- Validate input at every trust boundary.
- Authentication and object-level authorization on private operations.
- Role-based access control for provider/admin actions.
- Rate limiting, request-size limits, safe errors, and audit logging.
- Least-privilege database credentials and HTTPS.
- Minimize sensitive data and log redaction.
- Optional location permission with manual-location fallback.
- No diagnosis or prescription feature in MVP.
- Review applicable privacy and healthcare regulations before launch; do not claim compliance without legal review.

## 10. Reliability and scaling
Start simple. Add caching for public, non-sensitive records where freshness permits. Use background jobs only for work that needs retries or should not delay requests. Measure latency, errors, database load, and third-party costs before scaling. Define backup, recovery, and incident procedures before launch.

## 11. Architecture decision record
**ADR-001:** Use a modular monolith with Next.js Route Handlers and MongoDB Atlas for the MVP. Reconsider a separate Express API only if independent deployment, multiple clients, or operational requirements justify it.
