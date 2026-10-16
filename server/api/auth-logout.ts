import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/server/auth/get-session';

export async function handlePostLogout() {
  const response = NextResponse.json({
    data: { success: true },
    error: null,
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
