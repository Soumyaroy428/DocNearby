import { z } from 'zod';

export interface AiGenerateOptions<T = unknown> {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  schema?: z.ZodType<T, any, any>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AiGenerateResult<T = unknown> {
  data: T;
  rawText: string;
  provider: string; // 'gemini' | 'heuristic' | 'mock'
  latencyMs: number;
}

export interface IAiLanguageModelAdapter {
  name: string;
  isConfigured(): boolean;
  generateStructured<T>(options: AiGenerateOptions<T>): Promise<AiGenerateResult<T>>;
}
