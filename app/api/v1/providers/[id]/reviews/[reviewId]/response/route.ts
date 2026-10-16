import { NextRequest } from 'next/server';
import { handlePostProviderResponse } from '@/server/api/reviews';

interface Params {
  params: {
    id: string;
    reviewId: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  return handlePostProviderResponse(request, params.reviewId);
}

