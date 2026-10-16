import { Metadata } from 'next';
import { ContactPageView } from '@/client/views/ContactPageView';

export const metadata: Metadata = {
  title: 'Contact & Grievance Redressal | DocNearby',
  description: 'DocNearby support, provider onboarding, and DPDP Act 2023 statutory grievance redressal officer contact.',
};

export default function ContactPage() {
  return <ContactPageView />;
}

