import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/get-session';
import { appointmentService } from '@/server/services/appointment-service';
import { ZodError } from 'zod';

export async function handlePostAppointment(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be signed in to request an appointment.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await appointmentService.createAppointmentRequest(user.id, body);

    return NextResponse.json(
      {
        data: result.appointment,
        error: null,
        meta: {
          notification: result.notification,
          message:
            'Appointment request submitted. Please note this booking is requested and awaiting confirmation from the clinic.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appointment request data',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to request appointment.';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message,
        },
      },
      { status: 400 }
    );
  }
}

export async function handleGetAppointments(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to view your appointments.',
          },
        },
        { status: 401 }
      );
    }

    const appointments = await appointmentService.getUserAppointments(user.id);
    return NextResponse.json({
      data: appointments,
      error: null,
      meta: {
        total: appointments.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch appointments.';
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
