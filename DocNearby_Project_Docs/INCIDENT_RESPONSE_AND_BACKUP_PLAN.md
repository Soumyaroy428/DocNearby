# DocNearby — Incident Response, Backup & Disaster Recovery Runbook

**System:** DocNearby Healthcare Discovery Platform  
**Scope:** Production Deployment, Vercel Hosting, MongoDB Atlas, and External APIs (Google Places, Gemini AI)  
**Classification:** Operational Security & Reliability Protocol  
**Last Verified:** October 2026 (CC-09 Production Readiness)

---

## 1. Incident Severity Classification & SLAs

| Severity | Definition | Target MTTA (Ack) | Target MTTR (Resolve) | Escalation Channel |
|---|---|---|---|---|
| **Sev-1 (Critical)** | Entire site inaccessible, database down, or verified security/data breach | < 15 minutes | < 2 hours | Immediate emergency alert, on-call engineer, security lead |
| **Sev-2 (Major)** | Core discovery broken (search failing, booking route throwing 500s), but static assets available | < 30 minutes | < 4 hours | Operational Slack/Email alert to core developers |
| **Sev-3 (Minor)** | Non-blocking degradation (e.g. Gemini AI offline with heuristic fallback working, styling glitch) | < 2 hours | < 24 hours | Standard issue tracker |

---

## 2. Database Backup & Disaster Recovery (MongoDB Atlas)

### 2.1 Automated Snapshots & Retention
- **Automated Continuous Backup:** MongoDB Atlas automated daily snapshots configured with 7-day retention.
- **Point-in-Time Recovery (PITR):** Granular restore capability up to 72 hours prior to an incident.
- **Region Replication:** M10+ multi-zone replication in the `ap-south-1` (Mumbai, India) AWS region to guarantee low latency for Indian domestic and international travelers.

### 2.2 Point-in-Time Restoration Runbook
1. **Access Atlas Console:** Navigate to `MongoDB Atlas > Clusters > docnearby-prod > Backup`.
2. **Select Snapshot / Timestamp:** Choose the latest clean snapshot prior to corrupted transaction or data incident.
3. **Target Destination:** Restore to an isolated staging cluster (`docnearby-restore-temp`) first to verify data integrity.
4. **Integrity Validation:**
   - Execute verification query: verify `providers`, `appointments`, and `reviews` collections.
   - Run consistency check script: `npm run test` against staging URI.
5. **DNS / Connection Cutover:** Update `MONGODB_URI` environment variable in Vercel to point to restored cluster. Trigger zero-downtime redeploy.

### 2.3 Resilient In-Memory Dual-Mode Failover
- In the event of temporary MongoDB Atlas network partition or credentials failure, DocNearby's repository layer (`MemoryProviderRepository`, `MemoryUserRepository`) automatically maintains discovery functionality with clearly labelled demonstration datasets and in-memory caches, preventing HTTP 500 cascades for travelers searching for emergency facilities.

---

## 3. Secret Rotation & Key Lifecycle Management

All production secrets are injected via Vercel Production Environment Variables. **Zero secrets are committed to git.**

### 3.1 Secrets Inventory
| Secret Key | Service | Purpose | Rotation Frequency |
|---|---|---|---|
| `SESSION_SECRET` | Internal Auth | HMAC-SHA256 session token signature | Every 90 days or immediately upon breach |
| `MONGODB_URI` | MongoDB Atlas | Primary database connection string | Every 180 days |
| `GOOGLE_PLACES_API_KEY` | Google Maps Platform | Places search & geocoding proxy | Every 90 days |
| `GEMINI_API_KEY` | Google AI Studio | Structured multilingual intent extraction | Every 90 days |

### 3.2 Rotation Procedures
#### A. Rotating `SESSION_SECRET`
1. Generate high-entropy 64-byte cryptographic secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `SESSION_SECRET` in Vercel Environment Variables.
3. *Note:* Active user sessions will be required to re-authenticate on their next request.

#### B. Rotating `GOOGLE_PLACES_API_KEY` & `GEMINI_API_KEY`
1. Access Google Cloud Console / AI Studio and create a new restricted API key (with HTTP referrer or IP restrictions).
2. Add the new key to Vercel production environment variables.
3. Trigger a production deployment.
4. Verify `/api/v1/health` and test search at `/discovery`.
5. Revoke the retired key in Google Cloud Console.

---

## 4. Third-Party Outage Runbooks

### 4.1 Google Places API Downtime or Rate Limiting
- **Symptom:** External Google listings fail to fetch, or return 429 Too Many Requests.
- **Architectural Defense:** DocNearby implements `Promise.allSettled()` isolation between MongoDB and Google Places. If Google Places fails, DocNearby providers still load seamlessly.
- **Cache Shielding:** `server/services/google-places-adapter.ts` enforces an in-memory 10-minute LRU cache, absorbing traffic spikes.
- **Client Fallback:** If the client Google Maps JS SDK fails, `GoogleDiscoveryMap.tsx` automatically falls back to OpenStreetMap tiles.

### 4.2 Gemini AI API Outage
- **Symptom:** Natural language search or phrasebook parsing delays.
- **Architectural Defense:** `AiProviderManager` automatically detects Gemini timeouts (>8000ms) or 503 errors and falls back transparently to the local deterministic `HeuristicAiAdapter`.
- **User Impact:** Zero downtime; natural language queries continue to parse city, specialty, and budget with no user-facing errors.

---

## 5. Post-Mortem & Root Cause Analysis (RCA)

Following any Sev-1 or Sev-2 incident, the engineering team must publish an RCA document within 48 hours containing:
1. **Summary & Timeline:** Timestamped chronology from first alert to resolution.
2. **Root Cause:** Technical failure mechanism (code bug, third-party outage, config drift).
3. **Impact:** Number of affected traveler sessions or appointment requests.
4. **Corrective & Preventive Actions:** Pull requests, architectural improvements, or test additions to permanently prevent recurrence.

