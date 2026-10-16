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

