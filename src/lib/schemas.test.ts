import { describe, expect, it } from 'vitest';
import { loginSchema, newAppointmentSchema } from './schemas';
import { formatPrice, toBusinessDate } from './format';

describe('loginSchema', () => {
  it('accepts valid credentials and trims the e-mail', () => {
    const result = loginSchema.parse({ email: '  admin@agendamento.dev ', password: 'x' });
    expect(result.email).toBe('admin@agendamento.dev');
  });

  it('rejects an invalid e-mail and an empty password', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      'E-mail inválido',
      'Informe a senha',
    ]);
  });
});

describe('newAppointmentSchema', () => {
  it('requires a chosen slot', () => {
    const result = newAppointmentSchema.safeParse({
      professionalId: 'p1',
      serviceId: 's1',
      date: '2030-01-07',
      startsAt: '',
    });
    expect(result.error?.issues[0].message).toBe('Escolha um horário livre');
  });
});

describe('format helpers', () => {
  it('formats cents as BRL without float math in the data layer', () => {
    expect(formatPrice(8000).replace(/\s/g, ' ')).toBe('R$ 80,00');
  });

  it('converts an instant to the business date (UTC-3)', () => {
    expect(toBusinessDate('2030-01-08T02:00:00.000Z')).toBe('2030-01-07');
  });
});
