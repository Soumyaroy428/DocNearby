import { NextRequest } from 'next/server';
import { handleGetUnifiedSearch } from '@/server/api/unified-search';

export async function GET(request: NextRequest) {
  return handleGetUnifiedSearch(request);
}

