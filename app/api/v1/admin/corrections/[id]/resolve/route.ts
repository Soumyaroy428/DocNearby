import { NextRequest } from 'next/server';
import { handlePatchResolveCorrection } from '@/server/api/admin-reviews';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return handlePatchResolveCorrection(request, params.id);
}

