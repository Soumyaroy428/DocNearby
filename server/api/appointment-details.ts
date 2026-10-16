import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { appointmentService } from '@/server/services/appointment-service';

export async function handleGetAppointmentDetails(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to view appointment details.',
          },
        },
        { status: 401 }
      );
    }

    const result = await appointmentService.getAppointmentById(user.id, user.role, params.id);
    return NextResponse.json({
      data: result.appointment,
      error: null,
      meta: {
        notifications: result.notifications,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch appointment details.';
    const isForbidden = message.toLowerCase().includes('forbidden');
    return NextResponse.json(
      {
        data: null,
        error: {
          code: isForbidden ? 'FORBIDDEN' : 'NOT_FOUND',
          message,
        },
      },
      { status: isForbidden ? 403 : 404 }
    );
  }
}
