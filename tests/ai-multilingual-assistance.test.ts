import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeuristicAiAdapter } from '@/server/ai/adapters/heuristic-adapter';
import { MockAiAdapter } from '@/server/ai/adapters/mock-adapter';
import { AiProviderManager } from '@/server/ai/ai-provider-manager';
import { PrivacyScrubber } from '@/server/ai/privacy-scrubber';
import { SlidingWindowRateLimiter } from '@/server/ai/rate-limiter';
import { SafetyGuardrailEngine } from '@/server/ai/safety-guardrails';
import { MultilingualService } from '@/server/services/multilingual-service';
import {
  aiSearchIntentSchema,
  aiAssistRequestSchema,
} from '@/server/validation/ai-multilingual';

describe('CC-07 — AI and Multilingual Assistance', () => {
  let heuristicAdapter: HeuristicAiAdapter;
  let mockAdapter: MockAiAdapter;
  let aiManager: AiProviderManager;
  let multilingualService: MultilingualService;

  beforeEach(() => {
    heuristicAdapter = new HeuristicAiAdapter();
    mockAdapter = new MockAiAdapter();
    aiManager = new AiProviderManager(mockAdapter, heuristicAdapter);
    multilingualService = new MultilingualService(aiManager);
  });

  describe('1. Provider-Independent AI Architecture & Fallback', () => {
    it('generates structured search intent using primary adapter', async () => {
      mockAdapter.setMockResult({
        location: 'Kolkata',
        specialty: 'Dermatology',
        languages: ['English'],
        maxFeeMinor: 100000,
        currency: 'INR',
        providerType: 'doctor',
      });

      const result = await aiManager.generateStructured({
        prompt: 'Find a dermatologist in Kolkata under ₹1,000',
        schema: aiSearchIntentSchema,
      });

      expect(result.data.location).toBe('Kolkata');
      expect(result.data.specialty).toBe('Dermatology');
      expect(result.data.maxFeeMinor).toBe(100000);
      expect(result.provider).toBe('mock');
      expect(result.usedFallback).toBe(false);
    });

    it('seamlessly falls back to heuristic adapter when primary adapter fails', async () => {
      mockAdapter.setFailure(true, new Error('Gemini API quota exceeded'));

      const result = await aiManager.generateStructured({
        prompt: 'Find a pediatrician in Kolkata who speaks Bengali and English',
        schema: aiSearchIntentSchema,
      });

      expect(result.usedFallback).toBe(true);
      expect(result.provider).toBe('heuristic');
      expect(result.data.location).toBe('Kolkata');
      expect(result.data.specialty).toBe('Pediatrics');
      expect(result.data.languages).toContain('Bengali');
      expect(result.data.languages).toContain('English');
      expect(result.warning).toMatch(/Primary AI provider unreachable/);
    });
  });

  describe('2. Multilingual Query Understanding (English, Hindi, Bengali)', () => {
    it('extracts intent from English healthcare queries', async () => {
      const result = await heuristicAdapter.generateStructured({
        prompt: 'Find a dentist in New Delhi under ₹800',
        schema: aiSearchIntentSchema,
      });

      expect(result.data.location).toBe('New Delhi');
      expect(result.data.specialty).toBe('Dentistry');
      expect(result.data.maxFeeMinor).toBe(80000);
    });

    it('extracts intent from Hindi queries in Devanagari script', async () => {
      const result = await heuristicAdapter.generateStructured({
        prompt: 'कोलकाता में त्वचा विशेषज्ञ डॉक्टर 1000 रुपये के अंदर',
        schema: aiSearchIntentSchema,
      });

      expect(result.data.location).toBe('Kolkata');
      expect(result.data.specialty).toBe('Dermatology');
      expect(result.data.languages).toContain('Hindi');
      expect(result.data.maxFeeMinor).toBe(100000);
    });

    it('extracts intent from Bengali queries in Bengali script', async () => {
      const result = await heuristicAdapter.generateStructured({
        prompt: 'কলকাতায় শিশুর ডাক্তার ৫০০ টাকার মধ্যে',
        schema: aiSearchIntentSchema,
      });

      expect(result.data.location).toBe('Kolkata');
      expect(result.data.specialty).toBe('Pediatrics');
      expect(result.data.languages).toContain('Bengali');
      expect(result.data.maxFeeMinor).toBe(50000);
    });
  });

  describe('3. Privacy Minimization & PII Scrubbing', () => {
    it('redacts phone numbers, emails, and card numbers from queries before AI processing', () => {
      const sensitivePrompt =
        'My phone is +91 98765 43210 and email is patient@example.com, card 4111-2222-3333-4444. Find doctor in Kolkata.';

      const scrubbed = PrivacyScrubber.scrub(sensitivePrompt);

      expect(scrubbed.hadPii).toBe(true);
      expect(scrubbed.scrubbedText).not.toContain('98765');
      expect(scrubbed.scrubbedText).not.toContain('patient@example.com');
      expect(scrubbed.scrubbedText).not.toContain('4111-2222-3333-4444');
      expect(scrubbed.scrubbedText).toContain('[REDACTED_PHONE]');
      expect(scrubbed.scrubbedText).toContain('[REDACTED_EMAIL]');
      expect(scrubbed.scrubbedText).toContain('[REDACTED_CARD]');
    });

    it('redacts Indian Aadhaar and PAN card identifiers', () => {
      const idPrompt = 'My Aadhaar is 1234 5678 9012 and PAN ABCDE1234F. Need clinic in Delhi.';
      const scrubbed = PrivacyScrubber.scrub(idPrompt);

      expect(scrubbed.hadPii).toBe(true);
      expect(scrubbed.scrubbedText).not.toContain('1234 5678 9012');
      expect(scrubbed.scrubbedText).not.toContain('ABCDE1234F');
      expect(scrubbed.scrubbedText).toContain('[REDACTED_ID]');
    });

    it('records PII scrubbing metadata in managed AI calls', async () => {
      mockAdapter.setMockResult({
        location: 'Kolkata',
        specialty: 'General Medicine',
        languages: [],
        currency: 'INR',
      });

      const result = await aiManager.generateStructured({
        prompt: 'Call me at 9876543210 for doctor in Kolkata',
        schema: aiSearchIntentSchema,
      });

      expect(result.hadPiiScrubbed).toBe(true);
    });
  });

  describe('4. Rate Limiting & Abuse Prevention', () => {
    it('allows requests within window threshold', () => {
      const limiter = new SlidingWindowRateLimiter(3, 1000);
      expect(limiter.checkLimit('client-1').allowed).toBe(true);
      expect(limiter.checkLimit('client-1').allowed).toBe(true);
      expect(limiter.checkLimit('client-1').allowed).toBe(true);
    });

    it('blocks requests exceeding threshold within the sliding window', () => {
      const limiter = new SlidingWindowRateLimiter(2, 5000);
      expect(limiter.checkLimit('client-2').allowed).toBe(true);
      expect(limiter.checkLimit('client-2').allowed).toBe(true);

      const blocked = limiter.checkLimit('client-2');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetMs).toBeGreaterThan(0);
    });

    it('enforces request length limit (max 500 characters)', () => {
      const oversizedQuery = 'a'.repeat(505);
      expect(() =>
        aiAssistRequestSchema.parse({
          query: oversizedQuery,
        })
      ).toThrow(/Query cannot exceed 500 characters/);
    });
  });

  describe('5. Healthcare Safety Guardrails (No Diagnosis / No Prescription)', () => {
    it('detects acute medical emergency and provides 112/102 guidance', () => {
      const assessment = SafetyGuardrailEngine.evaluate(
        'I am having acute chest pain and difficulty breathing'
      );

      expect(assessment.isEmergency).toBe(true);
      expect(assessment.emergencyGuidance).toMatch(/Call 112 or 102 immediately/);
    });

    it('blocks diagnostic questions and returns non-clinical disclaimer', () => {
      const assessment = SafetyGuardrailEngine.evaluate(
        'What disease do I have, diagnose me please'
      );

      expect(assessment.isClinicalAdviceBlocked).toBe(true);
      expect(assessment.blockedAdviceExplanation).toMatch(
        /strictly does NOT provide medical diagnosis/
      );
    });

    it('blocks drug prescription requests', () => {
      const assessment = SafetyGuardrailEngine.evaluate(
        'Write me a prescription for amoxicillin antibiotics'
      );

      expect(assessment.isClinicalAdviceBlocked).toBe(true);
      expect(assessment.blockedAdviceExplanation).toMatch(/strictly does NOT provide.*prescription/);
    });

    it('suggests appropriate verified clinical specialty without diagnosing', () => {
      const assessment = SafetyGuardrailEngine.evaluate(
        'I have a red itchy skin rash on my arm, what disease is it?'
      );

      expect(assessment.isClinicalAdviceBlocked).toBe(true);
      expect(assessment.recommendedSpecialty).toBe('Dermatology');
    });
  });

  describe('6. Travel Health Communication Phrasebook', () => {
    it('returns verified trilingual communication phrases', () => {
      const phrases = multilingualService.getTravelPhrases('all');
      expect(phrases.length).toBeGreaterThan(5);

      const emergencyPhrase = phrases.find((p) => p.category === 'emergency')!;
      expect(emergencyPhrase.english).toBeDefined();
      expect(emergencyPhrase.hindi).toBeDefined();
      expect(emergencyPhrase.bengali).toBeDefined();
      expect(emergencyPhrase.bengaliTransliteration).toBeDefined();
    });

    it('filters phrases by category', () => {
      const pricingPhrases = multilingualService.getTravelPhrases('pricing');
      expect(pricingPhrases.every((p) => p.category === 'pricing')).toBe(true);
    });

    it('attaches emergency guidance and emergency phrases on urgent query', async () => {
      const response = await multilingualService.processAssistanceRequest(
        'Severe chest pain and difficulty breathing'
      );

      expect(response.safety.isEmergency).toBe(true);
      expect(response.travelPhrases).toBeDefined();
      expect(response.travelPhrases!.some((p) => p.category === 'emergency')).toBe(true);
      expect(response.suggestedActionText).toMatch(/Dial emergency services \(112 or 102\)/);
    });
  });
});
