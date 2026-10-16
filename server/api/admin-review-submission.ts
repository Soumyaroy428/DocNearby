import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { ZodError } from 'zod';

export async function handlePostAdminReviewSubmission(
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

    const submissionId = params.id;
    if (!submissionId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ID',
            message: 'Submission ID is required',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await providerService.reviewSubmission(user.id, submissionId, body);

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
            message: 'Invalid review action data',
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
          message: error instanceof Error ? error.message : 'An error occurred during review.',
        },
      },
      { status: 400 }
    );
  }
}

