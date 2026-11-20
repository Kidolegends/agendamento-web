import type {
  Appointment,
  AppointmentFilters,
  AuthResponse,
  Availability,
  Professional,
  Service,
} from './types';

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'agendamento.token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export interface FieldIssue {
  field: string;
  message: string;
}

/** Error thrown for every non-2xx response (and for network failures, with status 0). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Listener = () => void;
let onUnauthorized: Listener | null = null;
/** The auth provider registers a callback to be told when the API rejects our token. */
export function setUnauthorizedHandler(listener: Listener | null) {
  onUnauthorized = listener;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {},
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value) params.set(key, value);
  }
  const queryString = params.size > 0 ? `?${params}` : '';

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${queryString}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // A 401 on a protected call means the token expired. Login itself also returns 401
    // (wrong password), so we only react when we actually had a token.
    if (response.status === 401 && token) {
      tokenStorage.clear();
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      data?.message ?? 'Erro inesperado. Tente novamente.',
      Array.isArray(data?.issues) ? data.issues : [],
    );
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  listProfessionals: () => request<Professional[]>('/professionals'),
  listServices: () => request<Service[]>('/services'),

  getAvailability: (professionalId: string, serviceId: string, date: string) =>
    request<Availability>(`/professionals/${encodeURIComponent(professionalId)}/availability`, {
      query: { serviceId, date },
    }),

  listAppointments: (filters: AppointmentFilters = {}) =>
    request<Appointment[]>('/appointments', { query: { ...filters } }),

  createAppointment: (input: { professionalId: string; serviceId: string; startsAt: string }) =>
    request<Appointment>('/appointments', { method: 'POST', body: input }),

  cancelAppointment: (id: string) =>
    request<Appointment>(`/appointments/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' }),
};
