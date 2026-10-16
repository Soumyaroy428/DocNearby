'use client';

import React, { useState } from 'react';
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
  Accessibility,
  Flag,
  Calendar,
} from 'lucide-react';
import { Provider, ServicePrice } from '@/shared/types/provider';
import {
  formatPaiseToRupees,
  formatDate,
  getVerificationBadge,
  getPriceTypeBadge,
  getSourceTypeLabel,
  checkPriceStaleness,
} from '@/shared/utils/formatters';
import { SaveProviderButton } from '@/client/components/providers/SaveProviderButton';
import { FacilityMap } from '@/client/components/maps/FacilityMap';
import { PriceReportModal } from '@/client/components/pricing/PriceReportModal';
import { BookAppointmentModal } from '@/client/components/appointments/BookAppointmentModal';

interface ProviderDetailsViewProps {
  provider: Provider;
}

export function ProviderDetailsView({ provider }: ProviderDetailsViewProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportService, setSelectedReportService] = useState<ServicePrice | undefined>(undefined);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);
  const verification = getVerificationBadge(provider.verificationStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Search Results
        </Link>
      </div>

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
            <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setBookingServiceId(undefined);
                  setIsBookingOpen(true);
                }}
                className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Request Appointment</span>
              </button>
              <SaveProviderButton providerId={provider.id} variant="details" />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700">
          <Languages className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>
            <strong>Languages Spoken:</strong> {provider.languages.join(', ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Facility Location, Map & Directions
              </h2>
              <p className="text-xs text-slate-500">
                Turn-by-turn navigation, hours & verified accessibility features
              </p>
            </div>
          </div>

          {provider.facilities.map((fac) => (
            <FacilityMap key={fac.id} facility={fac} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Services & Transparent Pricing
            </h2>
            <p className="text-xs text-slate-500">
              Recorded consultation fees with documented verification source and freshness timestamp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full w-fit">
              Currency: INR (₹)
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedReportService(undefined);
                setIsReportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Flag className="w-3.5 h-3.5 text-amber-600" />
              Report Discrepancy
            </button>
          </div>
        </div>

        {provider.services && provider.services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Service Description</th>
                  <th className="py-3 px-4">Consultation Fee</th>
                  <th className="py-3 px-4">Price Type</th>
                  <th className="py-3 px-4">Source & Evidence</th>
                  <th className="py-3 px-4">Freshness Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {provider.services.map((srv) => {
                  const badge = getPriceTypeBadge(srv.priceType);
                  const staleness = checkPriceStaleness(srv.lastConfirmedAt);
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
                        <span className="font-medium text-slate-800">
                          {getSourceTypeLabel(srv.sourceType)}
                        </span>
                        {srv.sourceReference && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[200px]" title={srv.sourceReference}>
                            {srv.sourceReference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${staleness.className}`}>
                          {staleness.label}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {formatDate(srv.lastConfirmedAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingServiceId(srv.id);
                              setIsBookingOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Book Slot</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportService(srv);
                              setIsReportModalOpen(true);
                            }}
                            className="text-xs text-slate-500 hover:text-amber-700 underline font-medium"
                          >
                            Report
                          </button>
                        </div>
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

      <PriceReportModal
        provider={provider}
        service={selectedReportService}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <BookAppointmentModal
        provider={provider}
        initialServiceId={bookingServiceId}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

