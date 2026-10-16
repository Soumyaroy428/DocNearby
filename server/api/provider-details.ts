import { NextRequest, NextResponse } from 'next/server';
import { providerService } from '@/server/services/provider-service';

export async function handleGetProviderDetails(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ID',
            message: 'Provider ID is required',
          },
        },
        { status: 400 }
      );
    }

    const provider = await providerService.getProviderById(id);

    if (!provider) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Healthcare provider not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: provider,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching provider details.',
        },
      },
      { status: 500 }
    );
  }
}
