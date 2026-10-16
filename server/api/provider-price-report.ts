import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/server/services/provider-service';
import { getSessionUser } from '@/server/auth/get-session';
import { ZodError } from 'zod';

export async function handlePostPriceReport(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json();

    const report = await providerService.submitPriceReport(user?.id, {
      ...body,
      providerId: params.id,
    });

    return NextResponse.json(
      {
        data: report,
        error: null,
        meta: {
          message: 'Thank you! Your price report has been submitted for verification.',
        },
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
            message: 'Invalid price report submission',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to submit price report.';
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
