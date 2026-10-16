/**
 * Central AI Provider Manager
 * Implements vendor-neutral orchestration, PII data scrubbing,
 * transparent fallback handling, and telemetry.
 */

import { IAiLanguageModelAdapter, AiGenerateOptions, AiGenerateResult } from './adapters/ai-adapter.interface';
import { GeminiAiAdapter } from './adapters/gemini-adapter';
import { HeuristicAiAdapter } from './adapters/heuristic-adapter';
import { PrivacyScrubber } from './privacy-scrubber';

export interface ManagedAiResult<T> extends AiGenerateResult<T> {
  hadPiiScrubbed: boolean;
  usedFallback: boolean;
  warning?: string;
}

export class AiProviderManager {
  private primaryAdapter: IAiLanguageModelAdapter;
  private fallbackAdapter: IAiLanguageModelAdapter;

  constructor(
    primaryAdapter: IAiLanguageModelAdapter = new GeminiAiAdapter(),
    fallbackAdapter: IAiLanguageModelAdapter = new HeuristicAiAdapter()
  ) {
    this.primaryAdapter = primaryAdapter;
    this.fallbackAdapter = fallbackAdapter;
  }

  setPrimaryAdapter(adapter: IAiLanguageModelAdapter) {
    this.primaryAdapter = adapter;
  }

  setFallbackAdapter(adapter: IAiLanguageModelAdapter) {
    this.fallbackAdapter = adapter;
  }

  /**
   * Execute structured query generation with privacy minimization and safe fallback
   */
  async generateStructured<T>(options: AiGenerateOptions<T>): Promise<ManagedAiResult<T>> {
    // 1. Privacy minimization: Scrub PII from input text before external dispatch
    const { scrubbedText, hadPii } = PrivacyScrubber.scrub(options.prompt);

    const safeOptions: AiGenerateOptions<T> = {
      ...options,
      prompt: scrubbedText,
    };

    // 2. Check if primary adapter is configured
    if (!this.primaryAdapter.isConfigured()) {
      const fallbackResult = await this.fallbackAdapter.generateStructured(safeOptions);
      return {
        ...fallbackResult,
        hadPiiScrubbed: hadPii,
        usedFallback: true,
        warning: `${this.primaryAdapter.name} AI key not configured. Handled via local intent parser.`,
      };
    }

    // 3. Attempt primary adapter with graceful fallback
    try {
      const primaryResult = await this.primaryAdapter.generateStructured(safeOptions);
      return {
        ...primaryResult,
        hadPiiScrubbed: hadPii,
        usedFallback: false,
      };
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Unknown AI provider error';
      const fallbackResult = await this.fallbackAdapter.generateStructured(safeOptions);

      return {
        ...fallbackResult,
        hadPiiScrubbed: hadPii,
        usedFallback: true,
        warning: `Primary AI provider unreachable (${reason}). Seamlessly fallen back to local parser.`,
      };
    }
  }
}

export const aiProviderManager = new AiProviderManager();
