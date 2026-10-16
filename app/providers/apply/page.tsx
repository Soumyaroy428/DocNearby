import { ProviderApplyPageView } from '@/client/views/ProviderApplyPageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply to List Practice — DocNearby',
  description: 'Submit your clinic or medical practice for evidence-based verification and directory listing on DocNearby.',
};

export default function ProviderApplyPage() {
  return <ProviderApplyPageView />;
}
