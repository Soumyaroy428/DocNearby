# DocNearby — Project Memory and Decisions

This file records durable project decisions. Update it only when a decision is confirmed; distinguish proposals from verified implementation.

## Product identity
- Working name: DocNearby (renameable).
- Product: healthcare discovery for domestic and international travelers.
- Core value: help people find appropriate providers with transparent pricing and language/location filters.
- This is a discovery and navigation tool, not a diagnostic or treatment replacement.

## Confirmed direction from the project brief
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend preference: Next.js Route Handlers, or Node.js + Express if justified.
- Database: MongoDB.
- Wants a full-phase PRD, TRD, workflow, and checkpoint-driven implementation.
- AI should assist users, while manual functionality remains usable.
- Work must proceed one checkpoint at a time. After each checkpoint, report, wait for comments, address them, and wait for explicit approval before starting the next checkpoint.

## Proposed technical decisions (not yet verified against source code)
- Start with a modular monolith using Next.js Route Handlers.
- MongoDB Atlas for database hosting.
- Zod for request and AI-output validation.
- Vitest and Playwright for tests.
- Vercel is the initial deployment candidate.
- Mapping provider and AI provider remain to be selected.
- No microservices in MVP without a demonstrated need.

## Non-negotiable product safeguards
- Do not invent doctors, qualifications, registration, fees, reviews, hours, or availability.
- Mark demo data clearly.
- Verification labels must explain what was actually checked.
- Pricing must distinguish confirmed values from estimates and show freshness.
- AI must not diagnose, prescribe, verify credentials, or claim unsupported facts.
- Manual search must work without an AI provider or API key.
- Do not expose secrets, private verification documents, or sensitive user information.
- Do not deploy or push to GitHub without required approval.

## Current checkpoint
- `CC-00 — Repository Audit and Baseline`: VERIFIED.
- `CC-01 — Simple Manual + AI Healthcare Discovery`: VERIFIED and deployed.
- `CC-02 — Authentication and Authorization`: VERIFIED (Registration, login, sessions, roles, saved providers, object-level isolation).
- `Unified Client/Server Architecture Reorganization`: VERIFIED (Clean separation into `client/`, `server/`, `shared/`, `app/`).
- `CC-03 — Provider Directory and Verification`: VERIFIED (Provider application onboarding, admin verification governance, evidence records, suspension/reinstatement lifecycle, strict public vs. private field isolation; 42 passing tests).
- `CC-04 — Maps and Location`: VERIFIED (OpenStreetMap interactive mapping baseline, Haversine proximity calculations, radius filtering, distance sorting, universal navigation intent, permission-denied fallback, 55 passing tests).
- Implementation state: Fully verified and awaiting user review before CC-05.


## Update policy
When a decision changes, record date, decision, reason, and affected documents. Never rewrite an unverified assumption as a confirmed fact.
