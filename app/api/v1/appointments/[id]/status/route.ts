import { NextRequest } from 'next/server';
import { handlePatchAppointmentStatus } from '@/server/api/appointment-status';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlePatchAppointmentStatus(request, { params });
}
