import React from 'react';
import Link from 'next/link';
import { MapPin, Languages, AlertCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Provider } from '@/shared/types/provider';
import { formatPaiseToRupees, formatDate, getVerificationBadge, getPriceTypeBadge } from '@/shared/utils/formatters';
import { SaveProviderButton } from '@/client/components/providers/SaveProviderButton';

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const primaryFacility = provider.facilities[0];
  const primaryService = provider.services[0];
  const verification = getVerificationBadge(provider.verificationStatus);
  const priceTypeBadge = primaryService ? getPriceTypeBadge(primaryService.priceType) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${verification.className}`}
              title={verification.description}
            >
              {provider.verificationStatus === 'verified' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {verification.label}
            </span>

            {provider.isDemonstration && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Demo Listing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 capitalize">
              {provider.providerType.replace('_', ' ')}
            </span>
            <SaveProviderButton providerId={provider.id} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700">
          <Link href={`/providers/${provider.id}`} className="hover:underline">
            {provider.displayName}
          </Link>
        </h3>

        {provider.qualifications && provider.qualifications.length > 0 && (
          <p className="text-xs text-slate-500 mt-0.5">
            {provider.qualifications.join(', ')}
            {provider.experienceYears ? ` • ${provider.experienceYears} yrs experience` : ''}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {provider.specialties.map((spec) => (
            <span
              key={spec}
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100"
            >
              {spec}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          {primaryFacility && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{primaryFacility.name}</strong> — {primaryFacility.locality}, {primaryFacility.city}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Spoken: {provider.languages.join(', ')}</span>
          </div>
        </div>

        {primaryService ? (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium truncate max-w-[200px]" title={primaryService.serviceName}>
                {primaryService.serviceName}
              </span>
              {priceTypeBadge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priceTypeBadge.className}`}>
                  {priceTypeBadge.label}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900 flex items-center">
                {formatPaiseToRupees(primaryService.amountMinor)}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Updated {formatDate(primaryService.lastConfirmedAt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 italic">
            Consultation fee not published
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 max-w-[200px] truncate" title={provider.verificationSummary}>
          {provider.verificationSummary}
        </span>

        <Link
          href={`/providers/${provider.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
