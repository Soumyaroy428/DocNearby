import { NextRequest, NextResponse } from 'next/server';
import { multilingualService } from '@/server/services/multilingual-service';
import { aiAssistRequestSchema } from '@/server/validation/ai-multilingual';
import { aiRateLimiter } from '@/server/ai/rate-limiter';
import { ZodError } from 'zod';

export async function handlePostAiMultilingualAssist(request: NextRequest) {
  try {
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
            message: 'Rate limit exceeded. Please wait a moment before sending more queries.',
            retryAfterMs: rateLimit.resetMs,
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = aiAssistRequestSchema.parse(body);

    const result = await multilingualService.processAssistanceRequest(
      validated.query,
      validated.targetLanguage
    );

    return NextResponse.json({
      data: result,
      error: null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid multilingual assistance request',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Multilingual assistance error.';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}

