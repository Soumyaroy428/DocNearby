# Google Maps Platform & Google Places Healthcare Discovery Integration

**Project:** DocNearby  
**Tagline:** Trusted Care, Wherever You Are.  
**Module:** Google Maps & Google Places Healthcare Discovery  
**Status:** `COMPLETED — AWAITING USER REVIEW`  
**Automated Tests:** 17/17 Passed (`tests/google-places-integration.test.ts`)  
**Total Suite:** 107/107 Passed across 10 Test Suites  

---

## 1. Architectural Overview

DocNearby supports two distinct healthcare discovery sources:

### Source A — Google Places
- Publicly listed doctors, clinics, hospitals, and pharmacies discovered via the official Google Places API (New).
- Provides facility names, geocodes, addresses, phone numbers, websites, operating hours, ratings, and Google Maps directions links.
- **Strict Invariant:** Treated strictly as external, unverified public registry data. Labeled *"Google-listed"* and *"Not verified by DocNearby"*.
- **Booking Invariant:** External Google Places listings cannot be booked directly as DocNearby appointments.
- **Pricing Invariant:** Consultation fees are labeled *"Fee not verified by DocNearby"*; fees are never fabricated or guessed.

### Source B — DocNearby
- Registered healthcare providers and facilities stored in MongoDB.
- Includes statutory medical council registration checks (*"Registration verified"*), transparent CC-05 consultation fee schedules (*"Official Clinic Tariff Schedule"* / *"Direct Reception Inquiry"*), freshness indicators, and full CC-06 appointment booking capabilities.

---

## 2. Implemented Components & Services

### 2.1 Backend Services & API Adapters
1. **`server/services/google-places-service.ts`:**
   - Official Google Places API client with explicit field masks:
     `places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.rating,places.userRatingCount,places.types,places.googleMapsUri`
   - In-memory cache with 10-minute TTL for repeated coordinates and query searches.
   - Timeout protection (5,000ms `AbortController`).
   - XSS and HTML sanitization on external strings.
   - Built-in graceful degradation: returns structured `{ status: 'unconfigured' | 'unavailable' | 'error', places: [] }` without unhandled exceptions.

2. **`server/services/unified-search-service.ts`:**
   - Coordinates parallel discovery across DocNearby MongoDB and Google Places using `Promise.allSettled()`.
   - Normalizes entries into `UnifiedHealthcareListing`.
   - Great-circle Haversine distance calculations and radius filtering.
   - Independent fault isolation: Google Places API outages never impact DocNearby provider discovery; MongoDB issues never block Google Places discovery.

3. **`server/validation/unified-search.ts` & `app/api/v1/search/places/route.ts`:**
   - Zod validation for query parameters:
     - `latitude`: -90 to 90
     - `longitude`: -180 to 180
     - `radiusKm`: 0.5 to 50 km (default 10)
     - `source`: `'all' | 'docnearby' | 'google_places'`
     - `sortBy`: `'distance' | 'relevance' | 'rating'`
     - `query`: max 100 characters

### 2.2 Client Components & User Interface
1. **`client/components/maps/GoogleDiscoveryMap.tsx`:**
   - Responsive interactive map supporting mobile and desktop.
   - Custom markers: Teal for DocNearby providers, Indigo for Google Places listings.
   - InfoWindow popover on marker click with quick actions (Directions, Profile, Book Slot).
   - "Fit All" bounds button fitting all search results on screen.
   - Graceful fallback: If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not present or script fails to load, falls back to OpenStreetMap with universal Google Maps web navigation links.
   - Preserves Google Maps branding and attribution according to Google Maps Platform policies.

2. **`client/components/discovery/UnifiedResultCard.tsx`:**
   - Displays clear source attribution (*"Registered on DocNearby"* vs *"Google-listed"*).
   - Displays medical verification status (*"Registration verified"* vs *"Not verified by DocNearby"*).
   - Displays CC-05 transparent pricing or *"Fee not verified by DocNearby"*.
   - Enables "Book Slot" only for DocNearby providers; external listings clearly show *"Direct booking unavailable"*.
   - Contact options: Phone, website, and Google Maps turn-by-turn directions.

3. **`client/views/DiscoveryPageView.tsx` & `app/discovery/page.tsx`:**
   - Dedicated `/discovery` page featuring:
     - "Near Me" GPS location detection via `useGeolocation`.
     - Manual city/locality input.
     - Radius selection (2km, 5km, 10km, 25km, 50km).
     - Source filter tabs (All Sources, DocNearby Only, Google Places Only).
     - Sort by Distance, Relevance, or Google Rating.
     - Layout switcher (Split View, Cards Only, Map Only).
     - Full integration with CC-06 `BookAppointmentModal` for DocNearby providers.

---

## 3. Strict Invariants Verification

| Invariant | Implementation Mechanism | Test Verification |
|---|---|---|
| **Source Separation** | Separate `sourceBadge` (`"Registered on DocNearby"` vs `"Google-listed"`) throughout API and UI | `tests/google-places-integration.test.ts` (Passed) |
| **Verification Separation** | Google Places assigned `"not_verified_by_docnearby"` with clear explanatory tooltip | `tests/google-places-integration.test.ts` (Passed) |
| **Booking Invariant** | Google Places listings have `booking.isAvailable = false`; booking directly against Google Place ID is rejected on server | `tests/google-places-integration.test.ts` (Passed) |
| **Transparent Pricing (CC-05)** | Confirmed fees for DocNearby providers; Google Places listings display `"Fee not verified by DocNearby"` | `tests/google-places-integration.test.ts` (Passed) |
| **Fault Isolation** | `Promise.allSettled()` ensures Google Places failure does not block MongoDB, and vice versa | `tests/google-places-integration.test.ts` (Passed) |
| **Coordinate Validation** | Latitudes bounded to [-90, 90], longitudes to [-180, 180], radius to [0.5, 50] km | `tests/google-places-integration.test.ts` (Passed) |
| **Quota & Caching** | 10-minute in-memory cache prevents redundant Google Places API queries | `tests/google-places-integration.test.ts` (Passed) |

---

## 4. Environment Variables Configuration

| Variable | Description | Security Scope |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Secret API key used server-side for Google Places API (New) requests (`places.googleapis.com`) | Server-Side Only (`.env.local`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public API key used client-side for Google Maps JavaScript SDK rendering | Client-Side (`.env.local`) |
| *Fallback Behavior* | If keys are not configured, the platform operates seamlessly using DocNearby MongoDB discovery and OpenStreetMap / web intent navigation fallbacks. | Zero-breakage guarantee |
