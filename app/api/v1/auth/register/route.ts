import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import { registerSchema } from '@/lib/validation/auth';
import { SESSION_COOKIE_NAME } from '@/lib/auth/get-session';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const { user, token } = await authService.register(validated);

    const response = NextResponse.json({
      data: user,
      error: null,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please review registration fields',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'REGISTRATION_ERROR',
          message,
        },
      },
      { status: 400 }
    );
  }
}

