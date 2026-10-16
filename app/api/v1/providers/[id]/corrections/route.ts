import { NextRequest } from 'next/server';
import { handlePostProviderCorrection } from '@/server/api/reviews';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  return handlePostProviderCorrection(request, params.id);
}

