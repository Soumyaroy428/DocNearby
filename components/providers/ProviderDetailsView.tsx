import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Languages,
  Clock,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  FileText,
  Accessibility,
} from 'lucide-react';
import { Provider } from '@/lib/types/provider';
import { formatPaiseToRupees, formatDate, getVerificationBadge, getPriceTypeBadge } from '@/lib/utils';
import { SaveProviderButton } from '@/components/providers/SaveProviderButton';

interface ProviderDetailsViewProps {
  provider: Provider;
}

export function ProviderDetailsView({ provider }: ProviderDetailsViewProps) {
  const verification = getVerificationBadge(provider.verificationStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Search Results
        </Link>
      </div>

      {/* Main Header Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {provider.isDemonstration && (
          <div className="bg-amber-50 border-b border-amber-200 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 px-6 py-2 mb-6 text-xs text-amber-900 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <strong>Demonstration Listing:</strong> This provider is for product demonstration and test workflows. No real medical practitioner is represented.
            </span>
            <span className="uppercase tracking-wider text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-bold">
              Demo
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${verification.className}`}
              >
                {provider.verificationStatus === 'verified' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {verification.label}
              </span>

              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-md">
                {provider.providerType.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {provider.displayName}
            </h1>

            {provider.qualifications && provider.qualifications.length > 0 && (
              <p className="text-sm font-medium text-slate-600 mt-1">
                {provider.qualifications.join(', ')}
                {provider.experienceYears ? ` • ${provider.experienceYears} Years Clinical Practice` : ''}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {provider.specialties.map((spec) => (
                <span
                  key={spec}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Quick contact / direct instructions */}
          <div className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:min-w-[240px]">
            <span className="text-xs font-semibold text-slate-900 block mb-2.5">
              Contact & Inquiries
            </span>
            <div className="space-y-2 text-xs text-slate-700">
              {provider.publicContact.phone && (
                <a
                  href={`tel:${provider.publicContact.phone}`}
                  className="flex items-center gap-2 text-teal-700 hover:underline font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {provider.publicContact.phone}
                </a>
              )}
              {provider.publicContact.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{provider.publicContact.email}</span>
                </div>
              )}
              {provider.publicContact.website && (
                <a
                  href={provider.publicContact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-teal-700 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Clinic Website
                </a>
              )}
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200">
              <SaveProviderButton providerId={provider.id} variant="details" />
            </div>
          </div>
        </div>

        {/* Languages Banner */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700">
          <Languages className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>
            <strong>Languages Spoken:</strong> {provider.languages.join(', ')}
          </span>
        </div>
      </div>

      {/* Grid: Verification Details & Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Evidence Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Verification & Credentials Evidence
              </h2>
              <p className="text-xs text-slate-500">
                Evidence-based audit of statutory registration
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 block font-medium">Verification Status:</span>
              <span className="font-semibold text-slate-900">{verification.label}</span>
            </div>

            <div>
              <span className="text-slate-500 block font-medium">What was checked:</span>
              <span className="text-slate-800">
                {provider.verificationDetail?.whatWasChecked || provider.verificationSummary}
              </span>
            </div>

            {provider.registrationReference && (
              <div>
                <span className="text-slate-500 block font-medium">Regulatory Registration Ref:</span>
                <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                  {provider.registrationReference}
                </span>
              </div>
            )}

            {provider.verificationDetail && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Verified By:</span>
                  <span className="font-medium text-slate-800">{provider.verificationDetail.checkedBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Verification Date:</span>
                  <span className="font-medium text-slate-800">{formatDate(provider.verificationDetail.checkedAt)}</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 italic leading-relaxed">
            Note: Verification confirms identity and entry in relevant medical registries. It does not certify clinical superiority, diagnostic accuracy, or guaranteed treatment outcomes.
          </p>
        </div>

        {/* Facilities & Accessibility Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Facility Location & Hours
              </h2>
              <p className="text-xs text-slate-500">
                Where care is delivered
              </p>
            </div>
          </div>

          {provider.facilities.map((fac) => (
            <div key={fac.id} className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 text-sm">{fac.name}</span>
                <p className="text-slate-600 mt-0.5">
                  {fac.address}, {fac.locality}, {fac.city}, {fac.state || ''} {fac.country}
                </p>
              </div>

              {fac.hours && (
                <div className="flex items-center gap-2 text-slate-700 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Hours: {fac.hours}</span>
                </div>
              )}

              {fac.accessibilityAttributes && fac.accessibilityAttributes.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1">
                    <Accessibility className="w-3.5 h-3.5 text-teal-600" />
                    Accessibility Features:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {fac.accessibilityAttributes.map((attr) => (
                      <span
                        key={attr}
                        className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Services and Pricing Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Services & Transparent Pricing
            </h2>
            <p className="text-xs text-slate-500">
              Recorded consultation fees with documented verification source and freshness timestamp
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full w-fit">
            Currency: INR (₹)
          </span>
        </div>

        {provider.services && provider.services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Consultation Fee</th>
                  <th className="py-3 px-4">Price Type</th>
                  <th className="py-3 px-4">Source & Verification</th>
                  <th className="py-3 px-4">Last Confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {provider.services.map((srv) => {
                  const badge = getPriceTypeBadge(srv.priceType);
                  return (
                    <tr key={srv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {srv.serviceName}
                        {srv.notes && <p className="text-[11px] text-slate-500 mt-0.5">{srv.notes}</p>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {formatPaiseToRupees(srv.amountMinor)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-800 capitalize">
                          {srv.sourceType.replace(/_/g, ' ')}
                        </span>
                        {srv.sourceReference && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[200px]" title={srv.sourceReference}>
                            {srv.sourceReference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(srv.lastConfirmedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No published fee schedule recorded for this provider.
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Price Transparency Notice:</strong> Consultation fees represent direct baseline consultation charges recorded with the clinic or practitioner. Additional diagnostic tests, medications, procedures, or surgical interventions may incur separate costs. Always verify final cost with facility reception upon arrival.
          </span>
        </div>
      </div>
    </div>
  );
}

