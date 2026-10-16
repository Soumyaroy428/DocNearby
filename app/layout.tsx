import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/client/components/layout/Header';
import { Footer } from '@/client/components/layout/Footer';

export const metadata: Metadata = {
  title: 'DocNearby — Trusted Healthcare Discovery for Travelers',
  description: 'Find trusted doctors, clinics, and hospitals in unfamiliar cities with transparent pricing, language filters, and evidence-based verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
