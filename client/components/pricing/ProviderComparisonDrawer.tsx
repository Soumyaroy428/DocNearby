'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  X,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Accessibility,
  Languages,
  Clock,
  IndianRupee,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Provider } from '@/shared/types/provider';
import {
  formatPaiseToRupees,
  formatDate,
  getVerificationBadge,
  getPriceTypeBadge,
  getSourceTypeLabel,
  checkPriceStaleness,
} from '@/shared/utils/formatters';
import { formatDistance, getDirectionsUrl } from '@/shared/utils/geo';

interface ProviderComparisonDrawerProps {
  selectedProviders: Provider[];
  onRemove: (providerId: string) => void;
  onClear: () => void;
}

export function ProviderComparisonDrawer({
  selectedProviders,
  onRemove,
  onClear,
}: ProviderComparisonDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (selectedProviders.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Pill Trigger */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700/80 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-semibold">
            Compare Providers ({selectedProviders.length}/3)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-1"
          >
            Compare Now
            <Maximize2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-white p-1 rounded-full transition-colors"
            title="Clear comparison list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Side-by-Side Healthcare Comparison
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transparent consultation fees, verification evidence, and accessibility features
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            <div className="overflow-x-auto flex-1 p-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold text-slate-500 w-1/4">Criteria</th>
                    {selectedProviders.map((provider) => (
                      <th key={provider.id} className="py-3 px-4 w-1/4 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {provider.displayName}
                            </span>
                            <span className="text-[11px] text-slate-500 capitalize">
                              {provider.providerType.replace('_', ' ')} • {provider.specialties[0]}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(provider.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            title="Remove from comparison"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Primary Consultation Fee */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-teal-600" />
                      Primary Consultation Fee
                    </td>
                    {selectedProviders.map((provider) => {
                      const primary = provider.services[0];
                      const badge = primary ? getPriceTypeBadge(primary.priceType) : null;
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top">
                          {primary ? (
                            <div className="space-y-1">
                              <span className="text-base font-extrabold text-slate-900 block">
                                {formatPaiseToRupees(primary.amountMinor)}
                              </span>
                              {badge && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.className}`}>
                                  {badge.label}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 block">
                                {primary.serviceName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not published</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Price Freshness & Staleness */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      Price Freshness & Staleness
                    </td>
                    {selectedProviders.map((provider) => {
                      const primary = provider.services[0];
                      if (!primary) {
                        return <td key={provider.id} className="py-3.5 px-4 text-slate-400 italic">—</td>;
                      }
                      const staleness = checkPriceStaleness(primary.lastConfirmedAt);
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top space-y-1">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${staleness.className}`}>
                            {staleness.label}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Confirmed {formatDate(primary.lastConfirmedAt)}
                          </span>
                          {staleness.isStale && (
                            <p className="text-[10px] text-amber-800 leading-tight">
                              ⚠️ Last checked &gt;90 days ago. Confirm directly with clinic.
                            </p>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Price Evidence Source */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      Evidence Source
                    </td>
                    {selectedProviders.map((provider) => {
                      const primary = provider.services[0];
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top text-slate-600">
                          {primary ? (
                            <div>
                              <span className="font-medium text-slate-800 block">
                                {getSourceTypeLabel(primary.sourceType)}
                              </span>
                              {primary.sourceReference && (
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  Ref: {primary.sourceReference}
                                </span>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Statutory Verification Status */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Statutory Verification
                    </td>
                    {selectedProviders.map((provider) => {
                      const verification = getVerificationBadge(provider.verificationStatus);
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top">
                          <span className={`inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${verification.className}`}>
                            {verification.label}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                            {provider.verificationSummary}
                          </p>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Spoken Languages */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-teal-600" />
                      Languages Spoken
                    </td>
                    {selectedProviders.map((provider) => (
                      <td key={provider.id} className="py-3.5 px-4 align-top font-medium text-slate-800">
                        {provider.languages.join(', ')}
                      </td>
                    ))}
                  </tr>

                  {/* Facility Location & Distance */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-teal-600" />
                      Location & Distance
                    </td>
                    {selectedProviders.map((provider) => {
                      const facility = provider.facilities[0];
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top space-y-1">
                          <span className="font-bold text-slate-800 block">
                            {facility?.name}
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            {facility?.locality}, {facility?.city}
                          </span>
                          {provider.distanceKm !== undefined && (
                            <span className="inline-block text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              {formatDistance(provider.distanceKm)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Accessibility Features */}
                  <tr className="bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-1.5">
                      <Accessibility className="w-4 h-4 text-teal-600" />
                      Accessibility Features
                    </td>
                    {selectedProviders.map((provider) => {
                      const attrs = provider.facilities[0]?.accessibilityAttributes || [];
                      return (
                        <td key={provider.id} className="py-3.5 px-4 align-top">
                          {attrs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {attrs.map((attr) => (
                                <span
                                  key={attr}
                                  className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium"
                                >
                                  ✓ {attr}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None reported</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="py-4 px-4 font-semibold text-slate-700">Actions</td>
                    {selectedProviders.map((provider) => (
                      <td key={provider.id} className="py-4 px-4 align-top">
                        <Link
                          href={`/providers/${provider.id}`}
                          onClick={() => setIsOpen(false)}
                          className="w-full text-center py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center justify-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

