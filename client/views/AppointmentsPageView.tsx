'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Navigation,
  FileText,
  Mail,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Appointment, AppointmentStatus, NotificationLog } from '@/shared/types/appointment';
import { UserPublicProfile } from '@/shared/types/auth';
import { AppointmentStatusBadge } from '@/client/components/appointments/AppointmentStatusBadge';
import { formatPaiseToRupees, formatDate, formatRelativeTime } from '@/shared/utils/formatters';

export function AppointmentsPageView() {
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<Record<string, NotificationLog[]>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancellation modal state
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authJson = await authRes.json();
        if (authJson.data) {
          setCurrentUser(authJson.data);
          await loadAppointments();
        }
      } catch {
        // Unauthenticated
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await fetch('/api/v1/appointments');
      const json = await res.json();
      if (json.data) {
        setAppointments(json.data);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleFetchNotifications = async (appointmentId: string) => {
    if (activeNotifications[appointmentId]) return;
    try {
      const res = await fetch(`/api/v1/appointments/${appointmentId}`);
      const json = await res.json();
      if (json.meta?.notifications) {
        setActiveNotifications((prev) => ({
          ...prev,
          [appointmentId]: json.meta.notifications,
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  const toggleExpand = (appointmentId: string) => {
    if (expandedAppointmentId === appointmentId) {
      setExpandedAppointmentId(null);
    } else {
      setExpandedAppointmentId(appointmentId);
      handleFetchNotifications(appointmentId);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppointmentId) return;
    setIsSubmittingCancellation(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/appointments/${cancellingAppointmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled_by_patient',
          note: cancellationReason || 'Cancelled by traveler.',
        }),
      });

      // Also try PATCH if POST isn't caught
      const json = await res.json();

      if (!res.ok || json.error) {
        // Fallback to PATCH if method wasn't routed
        const patchRes = await fetch(`/api/v1/appointments/${cancellingAppointmentId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cancelled_by_patient',
            note: cancellationReason || 'Cancelled by traveler.',
          }),
        });
        const patchJson = await patchRes.json();
        if (!patchRes.ok || patchJson.error) {
          throw new Error(patchJson.error?.message || json.error?.message || 'Failed to cancel appointment.');
        }
      }

      setStatusMessage({
        type: 'success',
        text: 'Appointment was successfully cancelled and clinic notified.',
      });
      setCancellingAppointmentId(null);
      setCancellationReason('');
      await loadAppointments();
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error cancelling appointment.',
      });
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading your consultations...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Appointments</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Access your consultation requests, confirmed bookings, and clinic directions securely.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'pending') return apt.status === 'requested';
    if (statusFilter === 'confirmed') return apt.status === 'confirmed' || apt.status === 'rescheduled';
    if (statusFilter === 'cancelled') {
      return (
        apt.status === 'cancelled_by_patient' ||
        apt.status === 'cancelled_by_provider' ||
        apt.status === 'completed' ||
        apt.status === 'no_show'
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
              Care Portal
            </span>
            <span className="text-xs text-slate-500">Patient: {currentUser.name}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">My Medical Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track consultation requests, confirmed slots, directions, and notification history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-teal-600" />
            <span>Find Care</span>
          </Link>
          <button
            type="button"
            onClick={loadAppointments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Banners */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'pending'
              ? 'bg-sky-100 text-sky-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Requests ({appointments.filter((a) => a.status === 'requested').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Confirmed ({appointments.filter((a) => a.status === 'confirmed' || a.status === 'rescheduled').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            statusFilter === 'cancelled'
              ? 'bg-slate-200 text-slate-800 font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Past / Cancelled
        </button>
      </div>

      {/* Appointment Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No appointments found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You do not have any appointments matching this category.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Doctors & Clinics</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const isExpanded = expandedAppointmentId === apt.id;
            const notifs = activeNotifications[apt.id] || [];
            const canCancel = apt.status === 'requested' || apt.status === 'confirmed';

            return (
              <div
                key={apt.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{apt.id}</span>
                      <AppointmentStatusBadge status={apt.status} />
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      <Link href={`/providers/${apt.providerId}`} className="hover:text-teal-700 hover:underline">
                        {apt.providerName}
                      </Link>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancellingAppointmentId(apt.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpand(apt.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Audit & Logs'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Main appointment details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-slate-400 font-medium block">Care Facility</span>
                    <strong className="text-slate-800 block">{apt.facilityName}</strong>
                    {apt.facilityAddress && (
                      <p className="text-slate-500 text-[11px] leading-relaxed">{apt.facilityAddress}</p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-slate-400 font-medium block">Consultation Service</span>
                    <strong className="text-slate-800 block">{apt.serviceName}</strong>
                    {apt.estimatedFeeMinor !== undefined && (
                      <span className="text-slate-600 text-[11px] block">
                        Estimated Fee: <strong>{formatPaiseToRupees(apt.estimatedFeeMinor)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-slate-400 font-medium block">Scheduled Time</span>
                    {apt.status === 'confirmed' ? (
                      <div>
                        <strong className="text-emerald-700 block">
                          {formatDate(apt.confirmedDate || apt.requestedDate)}
                        </strong>
                        <span className="text-emerald-800 font-bold text-[11px] block">
                          Slot: {apt.confirmedTimeSlot || apt.requestedTimeSlot} (Confirmed)
                        </span>
                      </div>
                    ) : apt.status === 'rescheduled' ? (
                      <div>
                        <strong className="text-amber-800 block">
                          {formatDate(apt.rescheduledDate || apt.requestedDate)}
                        </strong>
                        <span className="text-amber-900 font-bold text-[11px] block">
                          New Slot: {apt.rescheduledTimeSlot} (Rescheduled)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-sky-800 block">{formatDate(apt.requestedDate)}</strong>
                        <span className="text-sky-900 font-medium text-[11px] block">
                          Requested Slot: {apt.requestedTimeSlot}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient notes or cancellation reason */}
                {apt.patientNotes && (
                  <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700">Patient Intake Note: </span>
                    <span className="italic">&quot;{apt.patientNotes}&quot;</span>
                  </div>
                )}

                {apt.cancellationReason && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    <span className="font-semibold">Cancellation Reason: </span>
                    <span>{apt.cancellationReason}</span>
                  </div>
                )}

                {apt.clinicInstructions && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="font-semibold">Clinic Instructions: </span>
                    <span>{apt.clinicInstructions}</span>
                  </div>
                )}

                {/* Expanded Section: Status History & Notification Dispatch Logs */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    {/* Status History Timeline */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Status History & Audit Trail
                      </span>
                      <div className="space-y-1.5 pl-2 border-l-2 border-teal-200">
                        {apt.statusHistory.map((entry, idx) => (
                          <div key={idx} className="text-xs text-slate-600 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 capitalize">
                                {entry.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(entry.changedAt)}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-[11px] text-slate-500 italic pl-1">
                                &quot;{entry.note}&quot;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification Dispatch Records */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Notification Delivery Audit (Idempotent & Retry-Safe)
                      </span>
                      {notifs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Loading notification logs...</p>
                      ) : (
                        <div className="space-y-2">
                          {notifs.map((n) => (
                            <div
                              key={n.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                                  <span>{n.channel.toUpperCase()} Alert</span>
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    n.status === 'delivered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {n.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-slate-600 font-medium">{n.subject}</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                <span className="font-mono">Key: {n.idempotencyKey}</span>
                                <span>{formatRelativeTime(n.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal Dialog */}
      {cancellingAppointmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cancel Appointment Request</h3>
                <p className="text-xs text-slate-500">
                  Reference: <span className="font-mono">{cancellingAppointmentId}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this booking? The clinic reception will be notified and your requested time slot released.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={2}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Travel itinerary changed, recovered, or schedule conflict..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppointmentId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancellation}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCancellation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
