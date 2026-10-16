import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { providerService } from '@/server/services/provider-service';
import { ZodError } from 'zod';

export async function handlePostResolvePriceReport(
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

    const body = await request.json();
    const resolved = await providerService.resolvePriceReport(user.id, params.id, body);

    return NextResponse.json({
      data: resolved,
      error: null,
      meta: {
        message: `Price report resolved as ${resolved.status}.`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid price report resolution data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to resolve price report.';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message,
        },
      },
      { status: 400 }
    );
  }
}
