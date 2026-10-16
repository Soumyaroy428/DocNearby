import { aiSearchIntentSchema, ValidatedAiSearchIntent } from '@/server/validation/search';
import { AiProviderManager, aiProviderManager as defaultAiManager } from '@/server/ai/ai-provider-manager';

export interface AiSearchFilterResult {
  intent: ValidatedAiSearchIntent;
  source: 'gemini' | 'heuristic_fallback';
  warning?: string;
}

export class AiSearchService {
  constructor(private aiManager: AiProviderManager = defaultAiManager) {}

  async extractSearchIntent(prompt: string): Promise<AiSearchFilterResult> {
    const result = await this.aiManager.generateStructured<ValidatedAiSearchIntent>({
      prompt,
      systemInstruction: `You are a healthcare discovery filter extractor.
Your ONLY task is to extract structured search filters from user query into JSON.
Return JSON with these exact keys:
- "location": string or null (city/locality name)
- "specialty": string or null (medical specialty)
- "languages": array of strings (e.g. ["English"])
- "maxFeeMinor": integer or null (maximum fee in paise; 1 INR = 100 paise. e.g. 1000 INR = 100000 paise)
- "currency": "INR"
- "providerType": "doctor" | "clinic" | "hospital" | "diagnostic_center" | null

Do NOT invent providers, names, medical advice, or treatments. Do NOT diagnose. Only extract search filters.`,
      schema: aiSearchIntentSchema,
      temperature: 0.1,
    });

    return {
      intent: result.data,
      source: result.provider === 'gemini' ? 'gemini' : 'heuristic_fallback',
      warning: result.warning,
    };
  }
}

export const aiSearchService = new AiSearchService();
