import { NextRequest } from 'next/server';
import { handlePatchModerateReview } from '@/server/api/admin-reviews';

interface Params {
  params: {
    reviewId: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handlePatchModerateReview(request, params.reviewId);
}

