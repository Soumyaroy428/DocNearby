import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth-service';
import { loginSchema } from '@/server/validation/auth';
import { SESSION_COOKIE_NAME } from '@/server/auth/get-session';
import { ZodError } from 'zod';

export async function handlePostLogin(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const { user, token } = await authService.login(validated);

    const response = NextResponse.json({
      data: user,
      error: null,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email or password format',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message,
        },
      },
      { status: 401 }
    );
  }
}
