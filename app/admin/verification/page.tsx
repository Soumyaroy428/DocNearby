import { AdminVerificationPageView } from '@/client/views/AdminVerificationPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Provider Verification Dashboard — DocNearby Admin',
  description: 'DocNearby Trust Operations portal for statutory medical council credential audit and verification.',
};

export default function AdminVerificationPage() {
  return <AdminVerificationPageView />;
}

