import { NextRequest, NextResponse } from 'next/server';
import { multilingualService } from '@/server/services/multilingual-service';
import { phrasebookQuerySchema } from '@/server/validation/ai-multilingual';
import { ZodError } from 'zod';

export async function handleGetPhrasebook(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, unknown> = {};
    searchParams.forEach((val, key) => {
      if (val !== '') queryParams[key] = val;
    });

    const validated = phrasebookQuerySchema.parse(queryParams);
    const phrases = multilingualService.getTravelPhrases(validated.category);

    return NextResponse.json({
      data: {
        phrases,
        total: phrases.length,
        category: validated.category,
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
            message: 'Invalid phrasebook parameters',
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
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve travel phrasebook',
        },
      },
      { status: 500 }
    );
  }
}
