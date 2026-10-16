import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/get-session';
import { authService } from '@/lib/services/auth-service';

export async function DELETE(
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
            message: 'Please sign in to manage saved providers.',
          },
        },
        { status: 401 }
      );
    }

    const targetId = params.id;
    if (!targetId) {
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

    // OBJECT-LEVEL AUTHORIZATION: removeSavedProvider only removes if user.id is the owner
    const removed = await authService.removeSavedProvider(user.id, targetId);

    if (!removed) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_FOUND_OR_FORBIDDEN',
            message: 'Saved provider record not found or not owned by your account.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing saved provider.',
        },
      },
      { status: 500 }
    );
  }
}

