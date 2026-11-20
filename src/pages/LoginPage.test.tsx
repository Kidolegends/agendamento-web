import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { adminUser, mockApi, renderWithProviders } from '../test/utils';

afterEach(() => vi.unstubAllGlobals());

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/appointments" element={<p>Lista de agendamentos</p>} />
    </Routes>,
    { route: '/login' },
  );
}

describe('LoginPage', () => {
  it('shows validation messages without calling the API', async () => {
    const calls = mockApi({});
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe o e-mail')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('logs in, stores the token and goes to the bookings list', async () => {
    const calls = mockApi({
      'POST /auth/login': () => ({ body: { token: 'jwt-token', user: adminUser } }),
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@agendamento.dev');
    await userEvent.type(screen.getByLabelText('Senha'), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Lista de agendamentos')).toBeInTheDocument();
    expect(calls[0].body).toEqual({ email: 'admin@agendamento.dev', password: 'admin123' });
    expect(localStorage.getItem('agendamento.token')).toBe('jwt-token');
  });

  it('shows the API error message when the password is wrong', async () => {
    mockApi({
      'POST /auth/login': () => ({ status: 401, body: { message: 'E-mail ou senha incorretos' } }),
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText('E-mail'), 'admin@agendamento.dev');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
    await waitFor(() => expect(localStorage.getItem('agendamento.token')).toBeNull());
  });
});
