import { aiSearchIntentSchema, ValidatedAiSearchIntent } from '@/server/validation/search';

export interface AiSearchFilterResult {
  intent: ValidatedAiSearchIntent;
  source: 'gemini' | 'heuristic_fallback';
  warning?: string;
}

function heuristicExtractIntent(prompt: string): ValidatedAiSearchIntent {
  const lower = prompt.toLowerCase();
  
  let location: string | null = null;
  const knownCities = ['kolkata', 'new delhi', 'delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad'];
  for (const city of knownCities) {
    if (lower.includes(city)) {
      location = city.charAt(0).toUpperCase() + city.slice(1);
      if (city === 'delhi' || city === 'new delhi') location = 'New Delhi';
      break;
    }
  }

  let specialty: string | null = null;
  const specialtyMap: Record<string, string> = {
    'dermatolog': 'Dermatology',
    'skin': 'Dermatology',
    'pediatric': 'Pediatrics',
    'child': 'Pediatrics',
    'cardiolog': 'Cardiology',
    'heart': 'Cardiology',
    'dental': 'Dentistry',
    'dentist': 'Dentistry',
    'general medicine': 'General Medicine',
    'physician': 'General Medicine',
    'internal medicine': 'Internal Medicine',
  };

  for (const [key, value] of Object.entries(specialtyMap)) {
    if (lower.includes(key)) {
      specialty = value;
      break;
    }
  }

  const languages: string[] = [];
  const knownLangs = ['english', 'bengali', 'hindi', 'punjabi', 'tamil', 'telugu'];
  for (const lang of knownLangs) {
    if (lower.includes(lang)) {
      languages.push(lang.charAt(0).toUpperCase() + lang.slice(1));
    }
  }

  let maxFeeMinor: number | null = null;
  const feeMatch = lower.match(/(?:under|below|less than|max|within)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (feeMatch && feeMatch[1]) {
    const rawNum = parseInt(feeMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rawNum) && rawNum > 0 && rawNum <= 100000) {
      maxFeeMinor = rawNum * 100;
    }
  }

  return {
    location,
    specialty,
    languages,
    maxFeeMinor,
    currency: 'INR',
    providerType: null,
  };
}

export class AiSearchService {
  async extractSearchIntent(prompt: string): Promise<AiSearchFilterResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const heuristicIntent = heuristicExtractIntent(prompt);
      return {
        intent: heuristicIntent,
        source: 'heuristic_fallback',
        warning: 'AI service key not configured in environment. Handled via local intent parser.',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const systemInstruction = `You are a healthcare discovery filter extractor.
Your ONLY task is to extract structured search filters from user query into JSON.
Return JSON with these exact keys:
- "location": string or null (city/locality name)
- "specialty": string or null (medical specialty)
- "languages": array of strings (e.g. ["English"])
- "maxFeeMinor": integer or null (maximum fee in paise; 1 INR = 100 paise. e.g. 1000 INR = 100000 paise)
- "currency": "INR"
- "providerType": "doctor" | "clinic" | "hospital" | "diagnostic_center" | null

Do NOT invent providers, names, medical advice, or treatments. Do NOT diagnose. Only extract search filters.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nUser query: "${prompt}"` }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            }
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const rawText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response from AI service');
      }

      const parsedJson = JSON.parse(rawText);
      const validatedIntent = aiSearchIntentSchema.parse(parsedJson);

      return {
        intent: validatedIntent,
        source: 'gemini',
      };
    } catch (err: unknown) {
      const fallbackIntent = heuristicExtractIntent(prompt);
      return {
        intent: fallbackIntent,
        source: 'heuristic_fallback',
        warning: `AI provider unreachable (${err instanceof Error ? err.message : 'timeout'}). Fallen back to local intent parser.`,
      };
    }
  }
}

export const aiSearchService = new AiSearchService();
