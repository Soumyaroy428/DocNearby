import { NextRequest } from 'next/server';
import { handleGetAdminPriceReports } from '@/server/api/admin-price-reports';

export async function GET(request: NextRequest) {
  return handleGetAdminPriceReports(request);
}

