import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { ZodError } from 'zod';

export async function handlePostAdminSuspendProvider(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Access restricted to DocNearby administrators.',
          },
        },
        { status: 403 }
      );
    }

    const providerId = params.id;
    if (!providerId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ID',
            message: 'Provider ID is required',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action || 'suspend';

    if (action === 'reinstate') {
      const whatWasChecked = body.whatWasChecked || 'Confirmed active status on medical registry';
      const result = await providerService.reinstateProvider(user.id, providerId, whatWasChecked);
      return NextResponse.json({
        data: result,
        error: null,
      });
    } else {
      const result = await providerService.suspendProvider(user.id, providerId, body);
      return NextResponse.json({
        data: result,
        error: null,
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid suspension data',
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
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'An error occurred during suspension.',
        },
      },
      { status: 400 }
    );
  }
}
