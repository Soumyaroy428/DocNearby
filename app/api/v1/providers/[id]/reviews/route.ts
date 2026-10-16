import { NextRequest } from 'next/server';
import { handleGetProviderReviews, handlePostProviderReview } from '@/server/api/reviews';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  return handleGetProviderReviews(params.id);
}

export async function POST(request: NextRequest, { params }: Params) {
  return handlePostProviderReview(request, params.id);
}

