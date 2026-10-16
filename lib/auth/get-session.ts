import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/auth-service';
import { UserPublicProfile } from '@/lib/types/auth';

export const SESSION_COOKIE_NAME = 'docnearby_session';

/**
 * Extracts and verifies the current session user from request cookies or Authorization header.
 */
export async function getSessionUser(request?: NextRequest): Promise<UserPublicProfile | null> {
  let token: string | undefined;

  // 1. Check Authorization header
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Check cookies
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In certain execution contexts cookies() may not be available
    }
  }

  if (!token) return null;

  return authService.getSessionUser(token);
}

