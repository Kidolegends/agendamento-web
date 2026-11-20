import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders, signIn } from '../test/utils';

function renderRoutes() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>Tela de login</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<p>Conteúdo protegido</p>} />
      </Route>
    </Routes>,
    { route: '/secret' },
  );
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to /login', () => {
    renderRoutes();
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('lets logged-in users through', () => {
    signIn();
    renderRoutes();
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
