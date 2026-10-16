import { NextRequest } from 'next/server';
import { handleGetAppointmentDetails } from '@/server/api/appointment-details';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleGetAppointmentDetails(request, { params });
}
