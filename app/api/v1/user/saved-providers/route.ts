import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/get-session';
import { authService } from '@/lib/services/auth-service';
import { saveProviderSchema } from '@/lib/validation/auth';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please sign in to view your saved providers.',
          },
        },
        { status: 401 }
      );
    }

    // OBJECT-LEVEL AUTHORIZATION: Only returns providers saved by this user
    const saved = await authService.getSavedProviders(user.id);

    return NextResponse.json({
      data: saved,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve saved providers.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please sign in to save providers to your account.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = saveProviderSchema.parse(body);

    const record = await authService.saveProvider(user.id, validated.providerId, validated.notes);
    if (!record) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Healthcare provider not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: record,
      error: null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
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
          message: 'An error occurred while saving provider.',
        },
      },
      { status: 500 }
    );
  }
}

