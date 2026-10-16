import { NextRequest } from 'next/server';
import { handlePostAiMultilingualAssist } from '@/server/api/ai-multilingual-assist';

export async function POST(request: NextRequest) {
  return handlePostAiMultilingualAssist(request);
}

