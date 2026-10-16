import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { reviewService } from '@/server/services/review-service';
import {
  createReviewSchema,
  flagReviewSchema,
  providerResponseSchema,
  providerCorrectionSchema,
} from '@/server/validation/review';
import { ZodError } from 'zod';

export async function handleGetProviderReviews(providerId: string) {
  try {
    const result = await reviewService.getProviderReviews(providerId);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: {
          disclaimer:
            'Patient reviews reflect individual traveler experiences and do not constitute clinical endorsement, quality certification, or statutory medical registration.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve reviews';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'INTERNAL_ERROR', message },
      },
      { status: 500 }
    );
  }
}

export async function handlePostProviderReview(request: NextRequest, providerId: string) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to submit a patient review.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    const review = await reviewService.submitReview({
      providerId,
      userId: user.id,
      authorName: user.name || 'Verified Traveler',
      reviewData: validatedData,
    });

    return NextResponse.json(
      {
        data: review,
        error: null,
        meta: {
          message:
            review.status === 'published'
              ? 'Review published successfully.'
              : 'Review received and queued for administrative review due to automated screening.',
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
            message: 'Invalid review submission data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to submit review';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

export async function handlePostFlagReview(request: NextRequest, reviewId: string) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to report a review.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = flagReviewSchema.parse(body);

    const flagReport = await reviewService.flagReview({
      reviewId,
      reporterUserId: user.id,
      reason: validated.reason,
      details: validated.details,
    });

    return NextResponse.json(
      {
        data: flagReport,
        error: null,
        meta: {
          message: 'Thank you for reporting this review. Our moderation team will investigate.',
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
            message: 'Invalid flag submission data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to report review';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

export async function handlePostProviderResponse(request: NextRequest, reviewId: string) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to respond to reviews.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = providerResponseSchema.parse(body);

    const updatedReview = await reviewService.respondToReview({
      reviewId,
      providerUserId: user.id,
      responderName: user.name,
      responseText: validated.responseText,
      isAdmin: user.role === 'admin',
    });

    return NextResponse.json(
      {
        data: updatedReview,
        error: null,
        meta: {
          message: 'Provider response posted successfully.',
        },
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
            message: 'Invalid provider response data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to post response';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

export async function handlePostProviderCorrection(request: NextRequest, providerId: string) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json();
    const validated = providerCorrectionSchema.parse({ ...body, providerId });

    const report = await reviewService.submitCorrectionReport({
      providerId,
      reporterUserId: user?.id,
      reporterEmail: validated.reporterEmail || user?.email,
      reporterRole: user?.role === 'provider' ? 'provider' : 'patient',
      correctionType: validated.correctionType,
      description: validated.description,
      suggestedValue: validated.suggestedValue,
    });

    return NextResponse.json(
      {
        data: report,
        error: null,
        meta: {
          message:
            'Profile correction report submitted. Our verification team will verify with the clinic and update the record.',
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
            message: 'Invalid correction report data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to submit correction report';
    return NextResponse.json(
      {
        data: null,
        error: { code: 'BAD_REQUEST', message },
      },
      { status: 400 }
    );
  }
}

