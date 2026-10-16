import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/client/components/providers/AppProviders';
import { Header } from '@/client/components/layout/Header';
import { Footer } from '@/client/components/layout/Footer';

export const metadata: Metadata = {
  title: 'DocNearby — Trusted Healthcare Discovery for Travelers',
  description: 'Find trusted doctors, clinics, and hospitals in unfamiliar cities with transparent pricing, language filters, and evidence-based verification.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden w-full max-w-full">
        <AppProviders>
          <Header />
          <main className="flex-1 w-full max-w-full">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
