import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { VerificationStatus, PriceType } from '@/shared/types/provider';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPaiseToRupees(amountMinor: number): string {
  const rupees = amountMinor / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) return formatDate(isoString);
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  } catch {
    return formatDate(isoString);
  }
}

export function getVerificationBadge(status: VerificationStatus): {
  label: string;
  className: string;
  description: string;
} {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified Registration',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        description: 'Identity and registration confirmed with official regulatory authorities.',
      };
    case 'verification_pending':
      return {
        label: 'Verification Pending',
        className: 'bg-amber-50 text-amber-800 border-amber-300',
        description: 'Listing submitted and currently under documentary review.',
      };
    case 'unverified':
      return {
        label: 'Unverified Community Listing',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
        description: 'Information submitted by community; independent verification not yet performed.',
      };
    case 'suspended':
      return {
        label: 'Listing Suspended',
        className: 'bg-rose-50 text-rose-800 border-rose-300',
        description: 'Listing temporarily suspended pending verification recheck.',
      };
    default:
      return {
        label: 'Status Unknown',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
        description: 'Verification status could not be established.',
      };
  }
}

export function getPriceTypeBadge(type: PriceType): {
  label: string;
  className: string;
} {
  switch (type) {
    case 'confirmed':
      return {
        label: 'Confirmed Fee',
        className: 'bg-teal-50 text-teal-800 border-teal-200',
      };
    case 'starting_from':
      return {
        label: 'Starting From',
        className: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    case 'estimate':
      return {
        label: 'Estimated Price',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'unavailable':
      return {
        label: 'Price Unavailable',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      };
  }
}

/**
 * Human-readable label for price evidence source.
 */
export function getSourceTypeLabel(sourceType: string): string {
  switch (sourceType) {
    case 'clinic_verified_fee_schedule':
      return 'Official Clinic Tariff Schedule';
    case 'reception_confirmed':
      return 'Direct Reception Inquiry';
    case 'facility_website_published':
      return 'Facility Website Published Rate';
    case 'patient_reported_community':
      return 'Patient Community Submission';
    default:
      return sourceType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Determines whether a price is stale (older than statutory threshold, default 90 days)
 * to ensure travelers are never misled by historical fee quotes.
 */
export function checkPriceStaleness(
  lastConfirmedAt: string,
  staleDaysThreshold = 90,
  referenceDate = new Date()
): {
  isStale: boolean;
  daysAgo: number;
  label: string;
  className: string;
  warningMessage?: string;
} {
  try {
    const confirmedDate = new Date(lastConfirmedAt);
    if (isNaN(confirmedDate.getTime())) {
      throw new Error('Invalid date');
    }
    const diffTime = Math.max(0, referenceDate.getTime() - confirmedDate.getTime());
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysAgo > staleDaysThreshold) {
      return {
        isStale: true,
        daysAgo,
        label: `Unverified >${staleDaysThreshold}d`,
        className: 'bg-amber-50 text-amber-900 border-amber-300',
        warningMessage: `This fee was last confirmed ${daysAgo} days ago (${formatDate(lastConfirmedAt)}). Additional clinic fees or rate revisions may apply. Please confirm directly with reception before seeking care.`,
      };
    }

    return {
      isStale: false,
      daysAgo,
      label: daysAgo === 0 ? 'Confirmed today' : `Confirmed ${daysAgo}d ago`,
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  } catch {
    return {
      isStale: true,
      daysAgo: 999,
      label: 'Date unverified',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
      warningMessage: 'Pricing confirmation date could not be established. Confirm directly before appointment.',
    };
  }
}


