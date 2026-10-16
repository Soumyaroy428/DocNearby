# Checkpoint CC-06 — Appointments & Notifications Lifecycle

**Status:** Completed & Verified  
**Date:** 2026-10-16  
**Test Suite:** `tests/appointment-service.test.ts` (14/14 passing, 90/90 overall)  
**TypeScript:** Passed (`tsc --noEmit` zero errors)  
**Production Build:** Clean (`next build` 24/24 static pages generated)  

---

## 1. Executive Summary & Core Invariant

In healthcare for travelers, ambiguity around appointment requests versus confirmed doctor availability creates severe patient safety and logistical risks. A patient traveling through an unfamiliar city who mistakes an unreviewed appointment request for an assured consultation slot could miss vital clinical intervention or arrive at a closed practice.

**CC-06 enforces the strict Request/Confirmation Invariant across DocNearby:**
1. **Strict Initial State Invariant:** Every appointment created by a patient enters the `requested` status. An appointment is **NEVER** automatically marked as `confirmed` upon submission.
2. **Explicit Confirmation Transition:** Only an authenticated healthcare provider or platform administrator can transition an appointment into `confirmed`, which requires recording official confirmation timestamps, clinic instructions, and issuing confirmation alerts.
3. **Unambiguous UI & Badge Labeling:**
   - `requested`: Sky-blue pulsing badge *"Request Submitted"* with explicit helper: *"Your booking request was received and is awaiting confirmation by the clinic."*
   - `confirmed`: Emerald badge *"Confirmed by Clinic"* with instructions and confirmed time slot.
   - `rescheduled`: Amber badge *"Rescheduled"* showing new slot and reason.
   - `cancelled_by_patient` / `cancelled_by_provider`: Distinct cancellation labels with audit reasons.
4. **Retry-Safe Idempotent Notifications:**
   - Transactional email and SMS logs (`NotificationLog`) generated deterministically using idempotency keys (`notif-${appointmentId}-${eventType}-v${attempt}`).
   - Duplicate dispatches are prevented.
   - Patient copy clearly emphasizes status (e.g. `[REQUEST SUBMITTED] (Pending Confirmation)` vs `[CONFIRMED]`).
5. **Object-Level Authorization & Privacy:**
   - Patients can only view and cancel their own appointments (`403 Forbidden` on unauthorized access).
   - Providers can only access appointments for their practice.
   - Terminal states (`completed`, `no_show`, `cancelled_by_patient`, `cancelled_by_provider`) are locked from further mutation.

---

## 2. Architecture & File Breakdown

### Shared Layer (`shared/`)
- `shared/types/appointment.ts`:
  - `AppointmentStatus`: `'requested' | 'confirmed' | 'rescheduled' | 'cancelled_by_patient' | 'cancelled_by_provider' | 'completed' | 'no_show'`
  - `Appointment`: Captures patient contact, provider, facility, service, estimated fee, requested/confirmed date & slot, status, history, instructions.
  - `NotificationLog`: Captures appointment ID, recipient, channel (`email` | `sms`), `eventType`, `status`, `idempotencyKey`, `attemptCount`, timestamps.
- `shared/utils/formatters.ts`:
  - `getAppointmentStatusBadge(status)`: Generates plain-English labels, visual classes, and `isConfirmed` / `isPending` flags.

### Server Layer (`server/`)
- `server/validation/appointment.ts`:
  - `createAppointmentSchema`: Zod validation for booking requests (enforces future date, valid email, phone, and optional notes).
  - `updateAppointmentStatusSchema`: Zod validation for status updates, requiring reasons for cancellations/rescheduling.
  - `rescheduleAppointmentSchema`: Zod validation for new date/time proposal.
- `server/services/notification-service.ts`:
  - `NotificationService`: Idempotent, retry-safe dispatch manager with `generateIdempotencyKey()`, transactional delivery emulation, and honest copy templates.
- `server/repositories/appointment-repository.ts`:
  - `IAppointmentRepository`: Data access interface for appointment CRUD, status history, and notification logs.
  - `MemoryAppointmentRepository`: In-memory storage seeded with demonstration appointments (`apt-demo-001` in `requested` state, `apt-demo-002` in `confirmed` state).
  - `MongoAppointmentRepository`: MongoDB Atlas collection persistence with fallback to memory.
- `server/services/appointment-service.ts`:
  - `createAppointmentRequest()`: Enforces the `requested` initial state invariant, validates provider and facility existence, and dispatches request notification.
  - `getAppointmentById()`: Enforces object-level authorization (patient, provider, admin).
  - `updateStatus()`: Validates transition rules, enforces role requirements, prevents mutation of terminal states, and triggers state change notifications.
  - `rescheduleAppointment()`: Validates new slot and records reason.

### API Adapters (`app/api/` & `server/api/`)
- `server/api/appointments.ts` -> `app/api/v1/appointments/route.ts` (GET, POST)
- `server/api/appointment-details.ts` -> `app/api/v1/appointments/[id]/route.ts` (GET)
- `server/api/appointment-status.ts` -> `app/api/v1/appointments/[id]/status/route.ts` (PATCH)

### Client UI Layer (`client/`)
- `client/components/appointments/AppointmentStatusBadge.tsx`: Visual badge with distinctive status icons (`Clock`, `CheckCircle2`, `CalendarClock`, `XCircle`).
- `client/components/appointments/BookAppointmentModal.tsx`: Patient booking dialog with facility selector, service fee quote, date/time picker, contact form, and prominent request invariant guidance.
- `client/views/AppointmentsPageView.tsx` & `app/appointments/page.tsx`: Traveler's appointment portal with status filtering (`All`, `Pending Requests`, `Confirmed`, `Past / Cancelled`), cancellation modal, expandable audit trail, and notification logs.
- `client/components/providers/ProviderDetailsView.tsx`: Integrated "Request Appointment" and "Book Slot" actions.
- `client/components/layout/Header.tsx`: Added "Appointments" navigation link for logged-in users.

---

## 3. Test Evidence

```
 ✓ tests/utils.test.ts (4 tests)
 ✓ tests/ai-search-service.test.ts (4 tests)
 ✓ tests/object-level-auth.test.ts (6 tests)
 ✓ tests/geospatial-search.test.ts (13 tests)
 ✓ tests/provider-service.test.ts (11 tests)
 ✓ tests/provider-verification.test.ts (8 tests)
 ✓ tests/transparent-pricing.test.ts (21 tests)
 ✓ tests/appointment-service.test.ts (14 tests)
 ✓ tests/auth-service.test.ts (9 tests)

 Test Files  9 passed (9)
      Tests  90 passed (90)
```

### Coverage in `tests/appointment-service.test.ts`:
- Label differentiation: `requested` (`isConfirmed: false`, `isPending: true`) vs `confirmed` (`isConfirmed: true`).
- Input validation: Future date constraint, email formatting, phone validation.
- Initial state invariant: Created booking is strictly `requested`, never `confirmed`.
- Provider / facility existence checks.
- Provider confirmation transition: Sets confirmed slot, clinic instructions, and dispatches confirmation alert.
- Patient cancellation: Allows patient to cancel their own request with reason.
- Terminal state protection: Cannot modify cancelled or completed appointments.
- Object-level authorization: Patient B cannot view or cancel Patient A's appointment; non-providers cannot confirm appointments; administrators have full supervisory access.
- Retry-safe notifications: Verifies deterministic idempotency keys and prevents double dispatch.

---

## 4. Verification Checkpoint Status

- [x] Appointment request and confirmation states strictly separated.
- [x] Cancellation and rescheduling rules enforced.
- [x] Retry-safe, idempotent notifications implemented.
- [x] Request/confirmation confusion prevented across UI and copy.
- [x] Unit and integration test suite passing (90/90 tests passed).
- [x] TypeScript typechecking passed (`tsc --noEmit` clean).
- [x] Next.js production build succeeded (`npm run build` 24/24 routes clean).
