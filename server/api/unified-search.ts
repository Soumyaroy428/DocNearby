import { NextRequest, NextResponse } from 'next/server';
import { unifiedSearchService } from '@/server/services/unified-search-service';
import { unifiedSearchQuerySchema } from '@/server/validation/unified-search';
import { ZodError } from 'zod';

export async function handleGetUnifiedSearch(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, unknown> = {};

    searchParams.forEach((val, key) => {
      if (val !== '') {
        queryParams[key] = val;
      }
    });

    const validated = unifiedSearchQuerySchema.parse(queryParams);
    const result = await unifiedSearchService.search(validated);

    return NextResponse.json({
      data: result.data,
      error: null,
      meta: result.meta,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Search error occurred.';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
