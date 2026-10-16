import { AdminReviewsPageView } from '@/client/views/AdminReviewsPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reviews & Trust Moderation — DocNearby Admin',
  description: 'DocNearby Trust Operations portal for moderating patient experience reviews and resolving provider profile corrections.',
};

export default function AdminReviewsPage() {
  return <AdminReviewsPageView />;
}

