import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { ZodError } from 'zod';

export async function handlePostProviderApplication(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to submit a provider listing application.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const submission = await providerService.submitProviderApplication(user.id, body);

    return NextResponse.json(
      {
        data: submission,
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid provider submission data. Please check required fields.',
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
          message: error instanceof Error ? error.message : 'An error occurred while submitting application.',
        },
      },
      { status: 500 }
    );
  }
}

