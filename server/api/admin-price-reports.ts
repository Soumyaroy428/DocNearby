import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { PriceCorrectionStatus } from '@/shared/types/provider';

export async function handleGetAdminPriceReports(request: NextRequest) {
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

    const statusParam = request.nextUrl.searchParams.get('status') as PriceCorrectionStatus | null;
    const reports = await providerService.getPriceReports(statusParam || undefined);

    return NextResponse.json({
      data: reports,
      error: null,
      meta: {
        total: reports.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve price reports.';
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

