import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../lib/auth';
import type { Appointment, Professional, Service, User } from '../lib/types';

type Handler = (request: { url: URL; method: string; body: unknown }) => {
  status?: number;
  body?: unknown;
};

export interface RecordedCall {
  method: string;
  path: string;
  search: string;
  body: unknown;
  headers: Headers;
}

/**
 * Replaces global fetch with a tiny router. Keys look like "GET /appointments".
 * Returns the list of calls so tests can assert what was sent to the API.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const url = new URL(input, 'http://localhost');
      const method = init.method ?? 'GET';
      const path = url.pathname.replace(/^\/api/, '');
      const body = init.body ? JSON.parse(init.body as string) : undefined;
      calls.push({ method, path, search: url.search, body, headers: new Headers(init.headers) });

      const handler = routes[`${method} ${path}`];
      if (!handler) return jsonResponse(404, { message: `unmocked ${method} ${path}` });
      const { status = 200, body: responseBody } = handler({ url, method, body });
      return jsonResponse(status, responseBody);
    }),
  );
  return calls;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const adminUser: User = {
  id: 'u1',
  name: 'Administrador',
  email: 'admin@agendamento.dev',
  role: 'admin',
};

/** Pretends a user is already logged in. */
export function signIn(user: User = adminUser) {
  localStorage.setItem('agendamento.token', 'fake-token');
  localStorage.setItem('agendamento.user', JSON.stringify(user));
}

export const professionals: Professional[] = [
  { id: 'p1', name: 'Ana Souza', specialty: 'Cabeleireira' },
  { id: 'p2', name: 'Bruno Lima', specialty: 'Barbeiro' },
];

export const services: Service[] = [
  { id: 's1', name: 'Corte feminino', durationMinutes: 60, priceCents: 8000 },
  { id: 's2', name: 'Barba', durationMinutes: 30, priceCents: 3000 },
];

export function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1',
    startsAt: '2030-01-07T13:00:00.000Z', // 10:00 in Brasília
    endsAt: '2030-01-07T14:00:00.000Z',
    status: 'scheduled',
    canceledAt: null,
    client: { id: 'c1', name: 'Maria Cliente', email: 'cliente@agendamento.dev' },
    professional: { id: 'p1', name: 'Ana Souza' },
    service: { id: 's1', name: 'Corte feminino', durationMinutes: 60, priceCents: 8000 },
    ...overrides,
  };
}
