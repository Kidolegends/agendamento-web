import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentsPage } from './AppointmentsPage';
import {
  makeAppointment,
  mockApi,
  professionals,
  renderWithProviders,
  signIn,
} from '../test/utils';

beforeEach(() => signIn());
afterEach(() => vi.unstubAllGlobals());

const canceled = makeAppointment({
  id: 'a2',
  status: 'canceled',
  canceledAt: '2030-01-01T12:00:00.000Z',
  client: { id: 'c2', name: 'João Cliente', email: 'joao@example.com' },
});

describe('AppointmentsPage', () => {
  it('lists bookings with client, professional, service, price and status', async () => {
    mockApi({
      'GET /professionals': () => ({ body: professionals }),
      'GET /appointments': () => ({ body: [makeAppointment(), canceled] }),
    });
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });

    expect(await screen.findByText('Maria Cliente')).toBeInTheDocument();
    expect(screen.getByText('João Cliente')).toBeInTheDocument();
    expect(screen.getByText('Agendado', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText('Cancelado', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getAllByText(/60 min · R\$\s80,00/)).toHaveLength(2);
  });

  it('sends the status filter to the API', async () => {
    const calls = mockApi({
      'GET /professionals': () => ({ body: professionals }),
      'GET /appointments': () => ({ body: [] }),
    });
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });
    await screen.findByText(/Nenhum agendamento encontrado/);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'canceled');

    await screen.findByText(/Nenhum agendamento encontrado/);
    const searches = calls.filter((c) => c.path === '/appointments').map((c) => c.search);
    expect(searches).toContain('?status=canceled');
  });

  it('filters by date on the client (business time zone)', async () => {
    mockApi({
      'GET /professionals': () => ({ body: professionals }),
      'GET /appointments': () => ({ body: [makeAppointment()] }),
    });
    renderWithProviders(<AppointmentsPage />, { route: '/appointments?date=2030-01-08' });
    expect(await screen.findByText(/Nenhum agendamento encontrado/)).toBeInTheDocument();
  });

  it('cancels a booking after confirmation and refreshes the list', async () => {
    let isCanceled = false;
    const calls = mockApi({
      'GET /professionals': () => ({ body: professionals }),
      'GET /appointments': () => ({
        body: [isCanceled ? makeAppointment({ status: 'canceled' }) : makeAppointment()],
      }),
      'PATCH /appointments/a1/cancel': () => {
        isCanceled = true;
        return { body: makeAppointment({ status: 'canceled' }) };
      },
    });
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    // Nothing is sent until the user confirms
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(await screen.findByRole('status')).toHaveTextContent('O horário voltou a ficar livre');
    expect(await screen.findByText('Cancelado', { selector: '.badge' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PATCH' && c.path === '/appointments/a1/cancel')).toBe(
      true,
    );
  });

  it('shows the API error when cancelling fails', async () => {
    mockApi({
      'GET /professionals': () => ({ body: professionals }),
      'GET /appointments': () => ({ body: [makeAppointment()] }),
      'PATCH /appointments/a1/cancel': () => ({
        status: 422,
        body: { message: 'Não é possível cancelar um agendamento que já começou' },
      }),
    });
    renderWithProviders(<AppointmentsPage />, { route: '/appointments' });

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Regra de agendamento')).toBeInTheDocument();
    expect(alert).toHaveTextContent('já começou');
  });
});
