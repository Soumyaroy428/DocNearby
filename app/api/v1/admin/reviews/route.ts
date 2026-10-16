import { NextRequest } from 'next/server';
import { handleGetAdminReviews } from '@/server/api/admin-reviews';

export async function GET(request: NextRequest) {
  return handleGetAdminReviews(request);
}

