import React from 'react';
import type { Metadata } from 'next';
import { providerService } from '@/server/services/provider-service';
import { ProviderDetailsView } from '@/client/components/providers/ProviderDetailsView';
import { ProviderNotFoundView } from '@/client/views/ProviderNotFoundView';

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = await providerService.getProviderById(params.id);
  if (!provider) {
    return {
      title: 'Provider Not Found — DocNearby',
    };
  }

  return {
    title: `${provider.displayName} — Healthcare Provider Profile | DocNearby`,
    description: `View verified qualifications, consultation fees, spoken languages, and facility details for ${provider.displayName}.`,
  };
}

export default async function ProviderPage({ params }: Props) {
  const provider = await providerService.getProviderById(params.id);

  if (!provider) {
    return <ProviderNotFoundView />;
  }

  return <ProviderDetailsView provider={provider} />;
}
