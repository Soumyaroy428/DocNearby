import { describe, it, expect } from 'vitest';
import { handleGetHealth } from '@/server/api/health';
import { PrivacyScrubber } from '@/server/ai/privacy-scrubber';
import { appointmentService } from '@/server/services/appointment-service';
import nextConfig from '../next.config.mjs';

describe('Production Readiness & Pilot Smoke Tests (CC-09)', () => {
  describe('1. Health Monitoring Endpoint (/api/v1/health)', () => {
    it('returns a healthy response with valid uptime, memory, and database status', async () => {
      const response = await handleGetHealth();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('0.1.0');
      expect(data.service).toContain('DocNearby');
      expect(typeof data.uptimeSeconds).toBe('number');
      expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);

      // Memory stats
      expect(data.memory).toBeDefined();
      expect(data.memory.rssMb).toBeGreaterThan(0);
      expect(data.memory.heapTotalMb).toBeGreaterThan(0);
      expect(data.memory.heapUsedMb).toBeGreaterThan(0);

      // Dual-mode database check
      expect(data.database).toBeDefined();
      expect(['mongodb', 'in-memory-fallback']).toContain(data.database.mode);
      expect(data.database.status).toBe('operational');

      // Pilot metadata
      expect(data.pilot).toBeDefined();
      expect(data.pilot.city).toBe('Kolkata');
      expect(data.pilot.country).toBe('India');
      expect(data.pilot.supportedZones).toContain('Park Street');
      expect(data.pilot.supportedZones).toContain('Salt Lake Sector V');
    });
  });

  describe('2. Security Hardening & Headers Configuration', () => {
    it('enforces strict HTTP security headers in next.config.mjs', async () => {
      expect(nextConfig.poweredByHeader).toBe(false);

      if (typeof nextConfig.headers === 'function') {
        const headerConfigs = await nextConfig.headers();
        expect(headerConfigs.length).toBeGreaterThan(0);

        const globalHeaders = headerConfigs[0].headers;
        const headerMap = new Map(globalHeaders.map((h: { key: string; value: string }) => [h.key, h.value]));

        // HSTS
        expect(headerMap.get('Strict-Transport-Security')).toContain('max-age=');
        expect(headerMap.get('Strict-Transport-Security')).toContain('includeSubDomains');

        // Clickjacking & MIME protection
        expect(headerMap.get('X-Frame-Options')).toBe('SAMEORIGIN');
        expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');

        // Referrer and permissions
        expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(headerMap.get('Permissions-Policy')).toContain('geolocation=');
      }
    });
  });

  describe('3. PII Scrubbing & Data Protection Under DPDP Act', () => {
    it('redacts sensitive personal identifiers from queries and text', () => {
      const input = 'My Aadhaar is 2345 6789 0123 and phone is 9876543210. Email me at traveler@example.com.';
      const { scrubbedText, hadPii } = PrivacyScrubber.scrub(input);

      expect(hadPii).toBe(true);
      expect(scrubbedText).not.toContain('2345 6789 0123');
      expect(scrubbedText).not.toContain('9876543210');
      expect(scrubbedText).not.toContain('traveler@example.com');
      expect(scrubbedText).toContain('[REDACTED_ID]');
      expect(scrubbedText).toContain('[REDACTED_PHONE]');
      expect(scrubbedText).toContain('[REDACTED_EMAIL]');
    });
  });

  describe('4. Healthcare Trust & Booking Invariant Protection', () => {
    it('rejects direct booking against non-existent or Google Place IDs without registered provider', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await expect(
        appointmentService.createAppointmentRequest('test-user-smoke', {
          providerId: 'google_place_nonexistent_9999',
          facilityId: 'nonexistent-fac',
          serviceName: 'Consultation',
          patientName: 'Test Traveler',
          patientEmail: 'traveler@example.com',
          patientPhone: '+91 98765 12345',
          requestedDate: tomorrow,
          requestedTimeSlot: '10:00 AM',
        })
      ).rejects.toThrow();
    });
  });
});

