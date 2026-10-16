import {
  IAiLanguageModelAdapter,
  AiGenerateOptions,
  AiGenerateResult,
} from './ai-adapter.interface';

export class MockAiAdapter implements IAiLanguageModelAdapter {
  readonly name = 'mock';
  private mockResult: unknown;
  private shouldFail: boolean = false;
  private failureError: Error = new Error('Simulated AI model failure');

  constructor(mockResult?: unknown) {
    this.mockResult = mockResult;
  }

  isConfigured(): boolean {
    return true;
  }

  setMockResult(result: unknown) {
    this.mockResult = result;
    this.shouldFail = false;
  }

  setFailure(shouldFail = true, error?: Error) {
    this.shouldFail = shouldFail;
    if (error) this.failureError = error;
  }

  async generateStructured<T>(options: AiGenerateOptions<T>): Promise<AiGenerateResult<T>> {
    if (this.shouldFail) {
      throw this.failureError;
    }

    const data = this.mockResult as T;
    const validatedData = options.schema ? options.schema.parse(data) : data;

    return {
      data: validatedData,
      rawText: JSON.stringify(data),
      provider: this.name,
      latencyMs: 5,
    };
  }
}

