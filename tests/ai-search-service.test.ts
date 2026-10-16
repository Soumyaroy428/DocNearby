import { describe, it, expect } from 'vitest';
import { AiSearchService } from '@/lib/services/ai-search-service';
import { aiSearchIntentSchema } from '@/lib/validation/search';

describe('AiSearchService & Intent Extraction', () => {
  const aiService = new AiSearchService();

  it('extracts filters from natural language using fallback parser when API key is absent', async () => {
    // Standard query from prompt: "Find an English-speaking dermatologist in Kolkata with a consultation fee below ₹1,000."
    const result = await aiService.extractSearchIntent(
      'Find an English-speaking dermatologist in Kolkata with a consultation fee below ₹1,000'
    );

    expect(result.source).toBe('heuristic_fallback');
    expect(result.intent.location).toBe('Kolkata');
    expect(result.intent.specialty).toBe('Dermatology');
    expect(result.intent.languages).toContain('English');
    expect(result.intent.maxFeeMinor).toBe(100000); // 1000 * 100 paise
  });

  it('extracts pediatric and language intent accurately', async () => {
    const result = await aiService.extractSearchIntent(
      'Need a pediatrician clinic in Kolkata speaking Bengali under 1500'
    );

    expect(result.intent.specialty).toBe('Pediatrics');
    expect(result.intent.location).toBe('Kolkata');
    expect(result.intent.languages).toContain('Bengali');
    expect(result.intent.maxFeeMinor).toBe(150000); // 1500 * 100 paise
  });

  it('validates structured intent against Zod schema', () => {
    const validJson = {
      location: 'Kolkata',
      specialty: 'Dermatology',
      languages: ['English'],
      maxFeeMinor: 100000,
      currency: 'INR',
      providerType: 'doctor',
    };

    const parsed = aiSearchIntentSchema.safeParse(validJson);
    expect(parsed.success).toBe(true);
  });

  it('rejects unsupported fields or invalid data types', () => {
    const invalidJson = {
      location: 'Kolkata',
      maxFeeMinor: 'not-a-number', // Should fail
    };

    const parsed = aiSearchIntentSchema.safeParse(invalidJson);
    expect(parsed.success).toBe(false);
  });
});

