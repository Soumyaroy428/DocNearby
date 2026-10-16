'use client';

import React from 'react';
import { LanguageProvider } from '@/client/context/LanguageContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

