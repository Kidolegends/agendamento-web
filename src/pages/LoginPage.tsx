import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../lib/auth';
import { loginSchema, type LoginForm } from '../lib/schemas';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<unknown>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/appointments';
  if (user) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setApiError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setApiError(error);
    }
  });

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={onSubmit} noValidate>
        <h1>📅 Agendamento</h1>
        <p className="muted">Entre para gerenciar os agendamentos.</p>

        <ErrorAlert error={apiError} />

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="username" {...register('email')} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </div>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="hint">
          Demo: <code>admin@agendamento.dev</code> / <code>admin123</code>
        </p>
      </form>
    </div>
  );
}
