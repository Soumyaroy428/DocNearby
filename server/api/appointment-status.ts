import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { appointmentService } from '@/server/services/appointment-service';
import { ZodError } from 'zod';

export async function handlePatchAppointmentStatus(
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
            message: 'Authentication required to update appointment status.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await appointmentService.updateStatus(user.id, user.role, params.id, body);

    return NextResponse.json({
      data: result.appointment,
      error: null,
      meta: {
        notification: result.notification,
        message: `Appointment status updated to ${result.appointment.status}.`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status update data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to update appointment status.';
    const isForbidden = message.toLowerCase().includes('forbidden');
    return NextResponse.json(
      {
        data: null,
        error: {
          code: isForbidden ? 'FORBIDDEN' : 'BAD_REQUEST',
          message,
        },
      },
      { status: isForbidden ? 403 : 400 }
    );
  }
}
