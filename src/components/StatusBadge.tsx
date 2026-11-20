import type { AppointmentStatus } from '../lib/types';

const LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  canceled: 'Cancelado',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
