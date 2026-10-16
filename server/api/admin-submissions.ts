import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { SubmissionStatus } from '@/shared/types/provider';

export async function handleGetAdminSubmissions(request: NextRequest) {
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

    const statusParam = request.nextUrl.searchParams.get('status') as SubmissionStatus | null;
    const submissions = await providerService.getSubmissions(statusParam || undefined);

    return NextResponse.json({
      data: submissions,
      error: null,
      meta: {
        total: submissions.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching provider applications.',
        },
      },
      { status: 500 }
    );
  }
}

