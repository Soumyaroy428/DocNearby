import { NextRequest } from 'next/server';
import { handlePostResolvePriceReport } from '@/server/api/admin-resolve-price-report';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handlePostResolvePriceReport(request, context);
}

