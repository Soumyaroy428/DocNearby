import { NextRequest } from 'next/server';
import { handlePostFlagReview } from '@/server/api/reviews';

interface Params {
  params: {
    id: string;
    reviewId: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  return handlePostFlagReview(request, params.reviewId);
}

