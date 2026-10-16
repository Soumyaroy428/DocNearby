import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/server/services/auth-service';
import { UserPublicProfile } from '@/shared/types/auth';

export const SESSION_COOKIE_NAME = 'docnearby_session';

export async function getSessionUser(request?: NextRequest): Promise<UserPublicProfile | null> {
  let token: string | undefined;

  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

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
