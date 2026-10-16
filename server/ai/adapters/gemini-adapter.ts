/**
 * Google Gemini API Language Model Adapter
 * Connects to Google Generative AI API with structured JSON output,
 * timeout controls, and runtime schema verification.
 */

import {
  IAiLanguageModelAdapter,
  AiGenerateOptions,
  AiGenerateResult,
} from './ai-adapter.interface';

const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiAiAdapter implements IAiLanguageModelAdapter {
  readonly name = 'gemini';
  private apiKey: string | null;
  private fetchFn: typeof fetch;

  constructor(apiKey?: string, fetchFn: typeof fetch = fetch) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null;
    this.fetchFn = fetchFn;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey || process.env.GEMINI_API_KEY);
  }

  setApiKey(key: string | null) {
    this.apiKey = key;
  }

  async generateStructured<T>(options: AiGenerateOptions<T>): Promise<AiGenerateResult<T>> {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is not configured.');
    }

    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 6000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const systemInstruction = options.systemInstruction || 'Return valid structured JSON.';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${key}`;

      const response = await this.fetchFn(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n${options.prompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: options.temperature ?? 0.1,
          },
        }),
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody.substring(0, 200)}`);
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response received from Gemini API');
      }

      const parsedData = JSON.parse(rawText);
      const validatedData = options.schema ? options.schema.parse(parsedData) : parsedData;

      const latencyMs = Date.now() - startTime;
      return {
        data: validatedData,
        rawText,
        provider: this.name,
        latencyMs,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

