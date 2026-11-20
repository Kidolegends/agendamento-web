import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewAppointmentPage } from './NewAppointmentPage';
import {
  makeAppointment,
  mockApi,
  professionals,
  renderWithProviders,
  services,
  signIn,
} from '../test/utils';

beforeEach(() => signIn());
afterEach(() => vi.unstubAllGlobals());

const availability = {
  professionalId: 'p1',
  serviceId: 's1',
  date: '2030-01-07',
  durationMinutes: 60,
  slots: [
    { time: '09:00', startsAt: '2030-01-07T12:00:00.000Z', endsAt: '2030-01-07T13:00:00.000Z' },
    { time: '10:00', startsAt: '2030-01-07T13:00:00.000Z', endsAt: '2030-01-07T14:00:00.000Z' },
  ],
};

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/appointments/new" element={<NewAppointmentPage />} />
      <Route path="/appointments" element={<p>Lista de agendamentos</p>} />
    </Routes>,
    { route: '/appointments/new' },
  );
}

async function fillSelection() {
  await screen.findByRole('option', { name: /Ana Souza/ });
  await screen.findByRole('option', { name: /Corte feminino/ });
  await userEvent.selectOptions(screen.getByLabelText('Profissional'), 'p1');
  await userEvent.selectOptions(screen.getByLabelText('Serviço'), 's1');
  await userEvent.type(screen.getByLabelText('Data'), '2030-01-07');
}

const baseRoutes = {
  'GET /professionals': () => ({ body: professionals }),
  'GET /services': () => ({ body: services }),
};

describe('NewAppointmentPage', () => {
  it('asks for the selection before showing slots, and does not call availability yet', async () => {
    const calls = mockApi({ ...baseRoutes });
    renderPage();
    expect(
      await screen.findByText(/Escolha profissional, serviço e data para ver os horários/),
    ).toBeInTheDocument();
    expect(calls.some((c) => c.path.includes('availability'))).toBe(false);
  });

  it('loads free slots from the availability endpoint and books the chosen one', async () => {
    const calls = mockApi({
      ...baseRoutes,
      'GET /professionals/p1/availability': () => ({ body: availability }),
      'POST /appointments': () => ({ status: 201, body: makeAppointment() }),
    });
    renderPage();
    await fillSelection();

    await userEvent.click(await screen.findByLabelText('10:00'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByText('Lista de agendamentos')).toBeInTheDocument();
    const availabilityCall = calls.find((c) => c.path === '/professionals/p1/availability');
    expect(availabilityCall?.search).toBe('?serviceId=s1&date=2030-01-07');
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({
      professionalId: 'p1',
      serviceId: 's1',
      startsAt: '2030-01-07T13:00:00.000Z',
    });
  });

  it('blocks submit with a friendly message when no slot is picked', async () => {
    const calls = mockApi({
      ...baseRoutes,
      'GET /professionals/p1/availability': () => ({ body: availability }),
    });
    renderPage();
    await fillSelection();
    await screen.findByLabelText('09:00');

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    expect(await screen.findByText('Escolha um horário livre')).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('explains when a day has no free slots', async () => {
    mockApi({
      ...baseRoutes,
      'GET /professionals/p1/availability': () => ({ body: { ...availability, slots: [] } }),
    });
    renderPage();
    await fillSelection();
    expect(await screen.findByText(/Nenhum horário livre nesse dia/)).toBeInTheDocument();
  });

  it('shows the double-booking error from the API (409) nicely', async () => {
    mockApi({
      ...baseRoutes,
      'GET /professionals/p1/availability': () => ({ body: availability }),
      'POST /appointments': () => ({
        status: 409,
        body: { message: 'O profissional já tem um agendamento nesse horário' },
      }),
    });
    renderPage();
    await fillSelection();
    await userEvent.click(await screen.findByLabelText('09:00'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Conflito de horário');
    expect(alert).toHaveTextContent('O profissional já tem um agendamento nesse horário');
  });
});
