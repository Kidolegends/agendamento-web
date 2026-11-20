// Types mirror the JSON returned by agendamento-api.

export type Role = 'admin' | 'cliente';
export type AppointmentStatus = 'scheduled' | 'canceled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string | null;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
}

export interface Slot {
  /** "HH:MM" in the business time zone */
  time: string;
  /** ISO instant (UTC) */
  startsAt: string;
  endsAt: string;
}

export interface Availability {
  professionalId: string;
  serviceId: string;
  date: string;
  durationMinutes: number;
  slots: Slot[];
}

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  canceledAt: string | null;
  client: { id: string; name: string; email: string };
  professional: { id: string; name: string };
  service: { id: string; name: string; durationMinutes: number; priceCents: number };
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  professionalId?: string;
}
