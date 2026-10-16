# DocNearby — Mapping Provider Evaluation & Architectural Decision

**Checkpoint:** CC-04 (Maps and Location)  
**Date:** 2026-10-16  
**Status:** APPROVED ARCHITECTURAL BASELINE  

---

## 1. Executive Summary

DocNearby is a healthcare discovery application designed for domestic and international travelers in unfamiliar cities. Reliable location awareness, distance calculation, accessibility markers, and turn-by-turn navigation are critical for travelers seeking nearby medical attention.

This evaluation reviews three mapping provider strategies against our core product principles: **trust, privacy, cost predictability, and zero-degradation fallback**.

---

## 2. Provider Comparative Analysis

| Evaluation Criteria | OpenStreetMap (OSM) / Leaflet | Google Maps Platform | Mapbox GL |
| :--- | :--- | :--- | :--- |
| **Licensing** | Open Data Commons Open Database License (ODbL). Permissive for commercial web use with proper attribution. | Proprietary commercial license. Strict terms preventing caching, geodata storage, or co-display with non-Google assets. | Proprietary commercial license based on Mapbox telemetry & terms of service. |
| **Cost & Free Tier** | **Free / Community Hosted** (Standard tile servers for low-medium traffic) or low-cost self-hosted vector tiles (Protomaps / Stadia). Zero unexpected billing spikes. | \$200 monthly free credit. Afterwards: \$7.00 per 1,000 Dynamic Maps loads, \$5.00 per 1,000 Geocoding requests, \$5.00 per 1,000 Directions requests. Can be expensive for early-stage or high-traffic projects. | 50,000 free monthly map loads. Afterwards: \$5.00 per 1,000 loads. Requires credit card and telemetry configuration. |
| **User Privacy** | **High:** No user tracking, no device fingerprinting, no cross-site advertising cookies. Geolocation coordinates stay strictly between client and application server. | **Medium-Low:** Requires Google JavaScript SDK which injects Google analytics/tracking scripts into user browsers. May trigger user consent barriers under GDPR/India DPDP. | **Medium:** Mapbox SDK collects telemetry by default unless explicitly opted out in code. |
| **Directions & Navigation** | Universal Web Intent: Links to `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG` or Apple Maps. Zero API cost, native device app handoff. | Interactive in-app directions routing requires Directions API billing or Google Maps Embed. | Mapbox Directions API requires billing per route calculation. |
| **Offline / Graceful Fallback** | **Excellent:** If tiles fail to load or are blocked by privacy extensions, fallback displays clear textual address, landmark description, and coordinates. | Fails completely with error watermarks if API key is invalid, missing, restricted, or billing quota is reached. | Fails completely if access token is invalid or rate limited. |

---

## 3. Architectural Decision

### Selected Strategy: Hybrid OpenStreetMap + Native Navigation Intent
1. **Interactive Client Maps:**
   - Use OpenStreetMap raster/vector tiles via Leaflet / modern React dynamic map integration.
   - Zero API key dependency for core discovery. No surprise billing or sudden service shutoff due to quota exhaustion.
   - Clean custom markers for healthcare facilities, clinic badges, and user location pin.
2. **Turn-by-Turn Navigation:**
   - External deep-linking intent: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${name}`.
   - When clicked on a mobile device, this triggers the user's native navigation app (Google Maps on Android, Apple Maps / Google Maps on iOS) with real-time GPS navigation, traffic, and public transit routing for free.
3. **Server-Side Geospatial Calculations:**
   - Geodetic calculations (distance in kilometers, radius filtering) are performed server-side using the Haversine formula in-memory and MongoDB `2dsphere` indexes in production.
   - Zero external geocoding requests required for directory queries.
4. **Graceful Degradation & Fallback:**
   - If location permission is denied by the user, manual city and locality search remains 100% operational.
   - If map scripts or tiles fail, facility cards clearly render full textual address, landmark, contact phone, and directions button.

---

## 4. Privacy & Statutory Compliance

- **Optional Geolocation:** Browser location is requested strictly on-demand after an explicit user click on the "Use My Location" or "Near Me" button. No automatic popups on initial page load.
- **Data Minimization:** Exact user coordinates are never stored in user database profiles or logged in persistent server storage. They are used purely ephemerally as search query parameters.
