import { NextRequest } from 'next/server';
import { handleGetPhrasebook } from '@/server/api/ai-phrasebook';

export async function GET(request: NextRequest) {
  return handleGetPhrasebook(request);
}
