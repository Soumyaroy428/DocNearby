import { NextRequest } from 'next/server';
import { handlePostPriceReport } from '@/server/api/provider-price-report';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handlePostPriceReport(request, context);
}

