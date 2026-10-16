import { describe, it, expect } from 'vitest';
import { formatPaiseToRupees, formatDate, getVerificationBadge, getPriceTypeBadge } from '@/lib/utils';

describe('Utility & Formatting Functions', () => {
  it('formats integer paise into Indian Rupee strings accurately', () => {
    // 80,000 paise = ₹800
    const formatted = formatPaiseToRupees(80000);
    expect(formatted).toContain('800');
    expect(formatted).toMatch(/₹|INR/);

    // 125,050 paise = ₹1,250.50
    const withDecimals = formatPaiseToRupees(125050);
    expect(withDecimals).toContain('1,250.5');
  });

  it('formats ISO dates cleanly', () => {
    const formatted = formatDate('2026-10-01T09:00:00Z');
    expect(formatted).toContain('2026');
  });

  it('generates correct verification badge properties', () => {
    const verified = getVerificationBadge('verified');
    expect(verified.label).toBe('Verified Registration');

    const pending = getVerificationBadge('verification_pending');
    expect(pending.label).toBe('Verification Pending');

    const unverified = getVerificationBadge('unverified');
    expect(unverified.label).toBe('Unverified Community Listing');
  });

  it('generates correct price type badge properties', () => {
    const confirmed = getPriceTypeBadge('confirmed');
    expect(confirmed.label).toBe('Confirmed Fee');

    const estimate = getPriceTypeBadge('estimate');
    expect(estimate.label).toBe('Estimated Price');
  });
});

