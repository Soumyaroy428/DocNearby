import { NextResponse } from 'next/server';
import { providerService } from '@/server/services/provider-service';

export async function handleGetMetadata() {
  try {
    const metadata = await providerService.getSearchMetadata();
    return NextResponse.json({
      data: metadata,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch search metadata.',
        },
      },
      { status: 500 }
    );
  }
}
