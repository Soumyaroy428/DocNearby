import { AppointmentsPageView } from '@/client/views/AppointmentsPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Medical Appointments — DocNearby',
  description: 'Manage your consultation requests, confirmed slots, directions, and notification audit logs.',
};

export default function AppointmentsPage() {
  return <AppointmentsPageView />;
}
