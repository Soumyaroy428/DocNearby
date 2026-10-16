import { NextRequest } from 'next/server';
import { handleGetAppointments, handlePostAppointment } from '@/server/api/appointments';

export async function GET(request: NextRequest) {
  return handleGetAppointments(request);
}

export async function POST(request: NextRequest) {
  return handlePostAppointment(request);
}
