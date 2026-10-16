# DocNearby — Engineering, Safety, and Workflow Rules

## A. Mandatory checkpoint workflow
1. Work on exactly one approved checkpoint at a time.
2. Inspect existing code and tests before changing files.
3. Keep changes scoped; do not rewrite working systems without a reason.
4. Implement, test, and update documentation for the current checkpoint.
5. Submit a detailed report and stop for user review.
6. When the user comments, address those comments within the same checkpoint, retest, update docs, and report again.
7. Start the next checkpoint only after explicit approval such as: “Approved. Start the next checkpoint.”
8. Silence, a question, or comments alone are not approval.
9. No production deployment or GitHub push without the required explicit authorization. Never force-push or discard user changes.

## B. Truthfulness
- Never claim tests, builds, integrations, deployment, or pushes succeeded unless executed and verified.
- Mark unimplemented features `NOT STARTED` or `UNVERIFIED`.
- Report blockers and failed tests honestly.
- Demo records must be clearly labelled as demo data.

## C. Healthcare trust and safety
- Never invent providers, credentials, prices, reviews, hours, or availability.
- Verification status must identify exactly what was checked, by whom/source, and when.
- Do not present provider verification as proof of clinical superiority.
- Do not diagnose, prescribe, or claim that symptoms are safe in this product.
- Provide appropriate emergency guidance for urgent scenarios without forcing an AI interaction.
- Price labels must distinguish confirmed prices, estimates, starting prices, and missing data.
- Do not claim compliance without appropriate review.

## D. Security and privacy
- Keep secrets server-side and out of Git, browser bundles, logs, screenshots, and API responses.
- Validate all request data and AI output.
- Use safe MongoDB query construction; never pass raw user input as arbitrary query operators.
- Enforce authentication, role checks, and object-level authorization.
- Minimize personal and health-related data.
- Do not store AI prompts by default; redact logs when logging is necessary.
- Protect private verification documents.
- Use rate limits, request-size limits, safe error responses, and least-privilege credentials.
- Make location permission optional and provide manual location entry.

## E. Engineering
- TypeScript strict mode.
- Shared validation schemas where appropriate.
- Keep route handlers thin; put business logic in services.
- Add tests for meaningful business rules and security boundaries.
- Use bounded pagination and database indexes for common searches.
- Avoid premature microservices and unnecessary dependencies.
- Preserve existing formatting and naming conventions unless there is a reason to change them.

## F. Completion report
Every checkpoint report must include changed files, implementation details, actual commands/tests and outcomes, acceptance criteria, known risks, docs updated, and next-step recommendation. End with:
- `COMPLETED — AWAITING USER REVIEW`
- `PARTIALLY COMPLETED — AWAITING USER COMMENTS`
- `BLOCKED — REQUIRES USER INPUT`
- `FAILED — REQUIRES FIXES`

Then STOP.
