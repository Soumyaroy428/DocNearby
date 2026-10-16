import { Metadata } from 'next';
import { DiscoveryPageView } from '@/client/views/DiscoveryPageView';

export const metadata: Metadata = {
  title: 'Nearby Healthcare Discovery | DocNearby',
  description:
    'Discover nearby doctors, clinics, and hospitals using Google Maps & DocNearby verified healthcare provider directory.',
};

export default function DiscoveryPage() {
  return <DiscoveryPageView />;
}
