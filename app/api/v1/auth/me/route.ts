import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/get-session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    return NextResponse.json({
      data: user,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to verify session.',
        },
      },
      { status: 500 }
    );
  }
}

