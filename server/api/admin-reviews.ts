import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { reviewService } from '@/server/services/review-service';
import { moderateReviewSchema, resolveCorrectionSchema } from '@/server/validation/review';
import { ReviewStatus, CorrectionStatus } from '@/shared/types/review';
import { ZodError } from 'zod';

export async function handleGetAdminReviews(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'FORBIDDEN', message: 'Administrator credentials required.' },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReviewStatus | undefined;

    const reviews = await reviewService.getAllReviewsForAdmin(status);
    const flags = await reviewService.getReviewFlagsForAdmin('pending');

    return NextResponse.json(
      {
        data: { reviews, pendingFlags: flags },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin reviews';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message },
      },
      { status: 500 }
    );
  }
}

export async function handlePatchModerateReview(request: NextRequest, reviewId: string) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'FORBIDDEN', message: 'Administrator credentials required.' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = moderateReviewSchema.parse(body);

    const updated = await reviewService.moderateReview({
      reviewId,
      status: validated.status,
      moderationReason: validated.moderationReason,
    });

    return NextResponse.json(
      {
        data: updated,
        error: null,
        meta: { message: `Review status updated to ${validated.status}` },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid moderation data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to moderate review';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

export async function handleGetAdminCorrections(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'FORBIDDEN', message: 'Administrator credentials required.' },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CorrectionStatus | undefined;

    const reports = await reviewService.getCorrectionReportsForAdmin(status);

    return NextResponse.json(
      {
        data: reports,
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch correction reports';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message },
      },
      { status: 500 }
    );
  }
}

export async function handlePatchResolveCorrection(request: NextRequest, reportId: string) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'FORBIDDEN', message: 'Administrator credentials required.' },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = resolveCorrectionSchema.parse(body);

    const updated = await reviewService.resolveCorrectionReport({
      reportId,
      status: validated.status,
      adminNotes: validated.adminNotes,
      resolvedByUserId: user.id,
    });

    return NextResponse.json(
      {
        data: updated,
        error: null,
        meta: { message: `Correction report marked as ${validated.status}` },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid correction resolution data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to resolve correction report';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

