import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/server/services/provider-service';
import { ZodError } from 'zod';

export async function handleGetProviders(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, unknown> = {};

    searchParams.forEach((val, key) => {
      if (val !== '') {
        queryParams[key] = val;
      }
    });

    const result = await providerService.searchProviders(queryParams);

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

    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while searching for healthcare providers.',
        },
      },
      { status: 500 }
    );
  }
}

