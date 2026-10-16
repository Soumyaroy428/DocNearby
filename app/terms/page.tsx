import { Metadata } from 'next';
import { TermsPageView } from '@/client/views/TermsPageView';

export const metadata: Metadata = {
  title: 'Terms of Service & Medical Disclaimer | DocNearby',
  description: 'DocNearby terms of service, statutory medical disclaimers, fee transparency guidelines, and user agreement.',
};

export default function TermsPage() {
  return <TermsPageView />;
}

