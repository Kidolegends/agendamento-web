import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setUnauthorizedHandler, tokenStorage } from './api';
import { mockApi } from '../test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('api client', () => {
  it('sends the JWT as a Bearer token', async () => {
    tokenStorage.set('abc123');
    const calls = mockApi({ 'GET /services': () => ({ body: [] }) });
    await api.listServices();
    expect(calls[0].headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('builds the query string and skips empty filters', async () => {
    const calls = mockApi({ 'GET /appointments': () => ({ body: [] }) });
    await api.listAppointments({ status: 'scheduled', professionalId: undefined });
    expect(calls[0].search).toBe('?status=scheduled');
  });

  it('turns API validation errors into ApiError with field issues', async () => {
    mockApi({
      'POST /auth/login': () => ({
        status: 400,
        body: {
          message: 'Dados inválidos',
          issues: [{ field: 'email', message: 'E-mail inválido' }],
        },
      }),
    });
    const error = await api.login('x', 'y').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.issues).toEqual([{ field: 'email', message: 'E-mail inválido' }]);
  });

  it('reports a network failure as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    const error = await api.listServices().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it('clears the token and notifies when a protected call returns 401', async () => {
    tokenStorage.set('expired');
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockApi({ 'GET /appointments': () => ({ status: 401, body: { message: 'Token inválido' } }) });

    await expect(api.listAppointments()).rejects.toBeInstanceOf(ApiError);
    expect(tokenStorage.get()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not treat a wrong password (401 without token) as an expired session', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockApi({
      'POST /auth/login': () => ({ status: 401, body: { message: 'E-mail ou senha incorretos' } }),
    });
    await expect(api.login('a@b.co', 'x')).rejects.toThrow('E-mail ou senha incorretos');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
