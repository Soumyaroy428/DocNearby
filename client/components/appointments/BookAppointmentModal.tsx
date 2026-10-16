'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Provider } from '@/shared/types/provider';
import { Appointment } from '@/shared/types/appointment';
import { UserPublicProfile } from '@/shared/types/auth';
import { formatPaiseToRupees } from '@/shared/utils/formatters';

interface BookAppointmentModalProps {
  provider: Provider;
  initialServiceId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (appointment: Appointment) => void;
}

const COMMON_TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '12:30 PM',
  '02:30 PM',
  '03:30 PM',
  '04:30 PM',
  '05:30 PM',
  '06:30 PM',
];

export function BookAppointmentModal({
  provider,
  initialServiceId,
  isOpen,
  onClose,
  onSuccess,
}: BookAppointmentModalProps) {
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form State
  const [facilityId, setFacilityId] = useState(provider.facilities[0]?.id || '');
  const [serviceId, setServiceId] = useState(initialServiceId || provider.services[0]?.id || '');
  const [requestedDate, setRequestedDate] = useState(() => {
    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [requestedTimeSlot, setRequestedTimeSlot] = useState(COMMON_TIME_SLOTS[1]);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientNotes, setPatientNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    async function loadAuth() {
      setIsCheckingAuth(true);
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        if (json.data) {
          setCurrentUser(json.data);
          setPatientName(json.data.name || '');
          setPatientEmail(json.data.email || '');
        }
      } catch {
        // Unauthenticated
      } finally {
        setIsCheckingAuth(false);
      }
    }
    if (isOpen) {
      loadAuth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedFacility = provider.facilities.find((f) => f.id === facilityId) || provider.facilities[0];
  const selectedService = provider.services.find((s) => s.id === serviceId) || provider.services[0];
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!patientName.trim()) throw new Error('Please enter patient name.');
      if (!patientEmail.trim()) throw new Error('Please enter contact email.');
      if (!patientPhone.trim()) throw new Error('Please enter phone number.');

      const payload = {
        providerId: provider.id,
        facilityId: selectedFacility?.id || '',
        serviceId: selectedService?.id,
        serviceName: selectedService?.serviceName || 'Consultation',
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        requestedDate,
        requestedTimeSlot,
        patientNotes: patientNotes.trim() || undefined,
      };

      const res = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to submit appointment request.');
      }

      setCreatedAppointment(json.data);
      if (onSuccess) onSuccess(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Request Consultation Appointment
              </h3>
              <p className="text-xs text-slate-500">{provider.displayName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Unauthenticated blocker */}
          {!isCheckingAuth && !currentUser ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Sign In Required</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                To prevent spam and keep your consultation records secure, appointment requests require an authenticated account.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : createdAppointment ? (
            /* Success confirmation */
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Request Submitted
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2">
                  Appointment Request Received!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Reference: <strong className="font-mono">{createdAppointment.id}</strong>
                </p>
              </div>

              {/* Status explanation */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-sky-900 text-xs">
                  <Info className="w-4 h-4 text-sky-700 flex-shrink-0" />
                  <span>Important: Request Pending Confirmation</span>
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  Your appointment is currently in <strong>REQUESTED</strong> status. The clinic reception has been notified to check room and doctor availability. You will receive an email confirmation once the slot is officially accepted.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <Link
                  href="/appointments"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
                >
                  View in My Appointments
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mandatory Invariant Guidance */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Notice to Travelers:</strong> Submitting this request does not guarantee immediate entry. The clinic reception will review doctor availability and confirm your booking.
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError(null)} className="underline text-xs">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Facility Selection */}
              {provider.facilities.length > 1 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Clinic / Hospital Facility
                  </label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {provider.facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} — {fac.locality}, {fac.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Consultation Service & Price Quote */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consultation Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  {provider.services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.serviceName} ({formatPaiseToRupees(srv.amountMinor)})
                    </option>
                  ))}
                </select>
                {selectedService && (
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>Estimated Fee:</span>
                    <strong className="text-slate-900 font-bold">
                      {formatPaiseToRupees(selectedService.amountMinor)}
                    </strong>
                  </div>
                )}
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requested Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={requestedTimeSlot}
                    onChange={(e) => setRequestedTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {COMMON_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Full Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number (SMS / WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address for Confirmation
                </label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  required
                  placeholder="patient@example.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Visit / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Briefly state symptoms or reason for visit (e.g. skin rash, general health checkup)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Booking Request...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Submit Appointment Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
