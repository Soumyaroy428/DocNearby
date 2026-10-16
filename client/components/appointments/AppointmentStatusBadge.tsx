import React from 'react';
import {
  Clock,
  CheckCircle2,
  CalendarClock,
  XCircle,
  CheckCheck,
  AlertOctagon,
} from 'lucide-react';
import { AppointmentStatus } from '@/shared/types/appointment';
import { getAppointmentStatusBadge } from '@/shared/utils/formatters';

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function AppointmentStatusBadge({ status, className = '' }: AppointmentStatusBadgeProps) {
  const badge = getAppointmentStatusBadge(status);

  const renderIcon = () => {
    switch (status) {
      case 'requested':
        return <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />;
      case 'confirmed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'rescheduled':
        return <CalendarClock className="w-3.5 h-3.5 text-amber-600" />;
      case 'cancelled_by_patient':
      case 'cancelled_by_provider':
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'completed':
        return <CheckCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'no_show':
        return <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className} ${className}`}
      title={badge.description}
    >
      {renderIcon()}
      <span>{badge.label}</span>
    </span>
  );
}
