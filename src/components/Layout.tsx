import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">📅 Agendamento</span>
        <nav aria-label="Principal">
          <NavLink to="/appointments" end>
            Agendamentos
          </NavLink>
          <NavLink to="/appointments/new">Novo agendamento</NavLink>
        </nav>
        <div className="user">
          <span>
            {user?.name} <small>({user?.role})</small>
          </span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
