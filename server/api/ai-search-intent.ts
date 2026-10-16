import { NextRequest, NextResponse } from 'next/server';
import { aiSearchService } from '@/server/services/ai-search-service';
import { aiSearchRequestSchema } from '@/server/validation/search';
import { aiRateLimiter } from '@/server/ai/rate-limiter';
import { SafetyGuardrailEngine } from '@/server/ai/safety-guardrails';
import { ZodError } from 'zod';

export async function handlePostAiSearchIntent(request: NextRequest) {
  try {
    // 1. Client IP / Rate Limiting
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-client';

    const rateLimit = aiRateLimiter.checkLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many AI search requests. Please wait a moment before trying again.',
            retryAfterMs: rateLimit.resetMs,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const validated = aiSearchRequestSchema.parse(body);

    // 2. Safety Guardrail Evaluation
    const safety = SafetyGuardrailEngine.evaluate(validated.prompt);

    const result = await aiSearchService.extractSearchIntent(validated.prompt);

    return NextResponse.json({
      data: {
        ...result,
        safety,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid AI search prompt',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'AI_PROCESSING_ERROR',
          message: 'Unable to process search prompt with AI. Manual search remains available.',
        },
      },
      { status: 500 }
    );
  }
}
