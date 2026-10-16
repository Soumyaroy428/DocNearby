'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  Globe,
  ExternalLink,
  Star,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  Building2,
  Stethoscope,
  Info,
} from 'lucide-react';
import { UnifiedHealthcareListing } from '@/shared/types/discovery';
import { formatDistance } from '@/shared/utils/geo';
import { formatPaiseToRupees } from '@/shared/utils/formatters';

interface UnifiedResultCardProps {
  listing: UnifiedHealthcareListing;
  isSelected?: boolean;
  onSelect?: (listing: UnifiedHealthcareListing) => void;
  onRequestAppointment?: (providerId: string, providerName: string) => void;
}

export function UnifiedResultCard({
  listing,
  isSelected = false,
  onSelect,
  onRequestAppointment,
}: UnifiedResultCardProps) {
  const isGoogle = listing.source === 'google_places';
  const isDocNearby = listing.source === 'docnearby';

  return (
    <div
      onClick={() => onSelect && onSelect(listing)}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="p-5 space-y-3.5">
        {/* Source & Verification Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Source Badge */}
          {isDocNearby ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Registered on DocNearby
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Google-listed
            </span>
          )}

          {/* Verification Status Badge */}
          {listing.verificationStatus === 'verified' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title={listing.verificationBadge.tooltip}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Registration verified
            </span>
          )}

          {listing.verificationStatus === 'verification_pending' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
              title={listing.verificationBadge.tooltip}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Verification pending
            </span>
          )}

          {listing.verificationStatus === 'not_verified_by_docnearby' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
              title={listing.verificationBadge.tooltip}
            >
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              Not verified by DocNearby
            </span>
          )}

          {listing.verificationStatus === 'unverified' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
              title={listing.verificationBadge.tooltip}
            >
              Unverified listing
            </span>
          )}
        </div>

        {/* Title, Facility & Distance */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              {listing.name}
            </h3>
            {listing.distanceKm !== undefined && (
              <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {formatDistance(listing.distanceKm)}
              </span>
            )}
          </div>

          {listing.facilityName && listing.facilityName !== listing.name && (
            <p className="text-xs font-medium text-slate-600 mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              {listing.facilityName}
            </p>
          )}

          <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{listing.address}</span>
          </p>
        </div>

        {/* Rating and Reviews (for Google Places) */}
        {listing.rating !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-slate-900">{listing.rating.toFixed(1)}</span>
            {listing.userRatingCount !== undefined && (
              <span className="text-slate-400">({listing.userRatingCount} Google reviews)</span>
            )}
            {listing.openNow !== undefined && (
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  listing.openNow
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {listing.openNow ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>
        )}

        {/* Specialties and Languages (for DocNearby) */}
        {listing.specialties && listing.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {listing.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Pricing Block — Strictly Preserving CC-05 */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Consultation Fee:</span>
            {listing.pricing.isAvailable && listing.pricing.amountMinor !== undefined ? (
              <div className="text-right">
                <span className="font-bold text-slate-900 text-sm">
                  {formatPaiseToRupees(listing.pricing.amountMinor)}
                </span>
                <span className="block text-[10px] text-teal-700 font-medium">
                  {listing.pricing.sourceLabel}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">
                {listing.pricing.sourceLabel || 'Fee not available'}
              </span>
            )}
          </div>

          {listing.pricing.isStale && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Fee last confirmed &gt;90d ago. Confirm directly with clinic.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer — Strictly Preserving CC-06 Appointments */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {listing.contact.phone && (
            <a
              href={`tel:${listing.contact.phone}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Call Facility"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              Call
            </a>
          )}

          {listing.contact.website && (
            <a
              href={listing.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              title="Visit Website"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              Web
            </a>
          )}

          <a
            href={listing.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            title="Open in Google Maps Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigation className="w-3.5 h-3.5 text-teal-600" />
            Directions
          </a>
        </div>

        {/* Booking CTA or External Notice */}
        {listing.booking.isAvailable && listing.booking.providerId ? (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/providers/${listing.booking.providerId}`}
              className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestAppointment) {
                  onRequestAppointment(listing.booking.providerId!, listing.name);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Book Slot
            </button>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 py-1"
            title={listing.booking.reasonUnavailable || 'Direct booking unavailable'}
          >
            <CalendarX className="w-3.5 h-3.5" />
            <span className="text-[11px]">Direct booking unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}
