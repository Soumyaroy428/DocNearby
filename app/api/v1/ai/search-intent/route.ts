import { NextRequest, NextResponse } from 'next/server';
import { aiSearchService } from '@/lib/services/ai-search-service';
import { aiSearchRequestSchema } from '@/lib/validation/search';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = aiSearchRequestSchema.parse(body);

    const result = await aiSearchService.extractSearchIntent(validated.prompt);

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

