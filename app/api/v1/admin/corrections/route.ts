import { NextRequest } from 'next/server';
import { handleGetAdminCorrections } from '@/server/api/admin-reviews';

export async function GET(request: NextRequest) {
  return handleGetAdminCorrections(request);
}

