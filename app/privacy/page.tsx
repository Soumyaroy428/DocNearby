import { Metadata } from 'next';
import { PrivacyPolicyPageView } from '@/client/views/PrivacyPolicyPageView';

export const metadata: Metadata = {
  title: 'Privacy Policy | DocNearby — Trusted Care, Wherever You Are',
  description: 'DocNearby healthcare discovery privacy policy, data minimization guarantees, and DPDP Act 2023 compliance.',
};

export default function PrivacyPage() {
  return <PrivacyPolicyPageView />;
}

