import { AdminPriceReportsPageView } from '@/client/views/AdminPriceReportsPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Price Transparency Reports — DocNearby Admin',
  description: 'DocNearby Trust Operations portal for reviewing patient-reported consultation fee discrepancies and stale price updates.',
};

export default function AdminPriceReportsPage() {
  return <AdminPriceReportsPageView />;
}

