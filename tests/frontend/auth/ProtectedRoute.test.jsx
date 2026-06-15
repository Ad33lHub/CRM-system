import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import ProtectedRoute from '@/components/common/ProtectedRoute';

function createStore(authState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  });
}

function renderWithRoute(store, initialPath, requiredRoles = []) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRoles={requiredRoles} />}>
            <Route path="/dashboard" element={<div data-testid="protected-content">Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/403" element={<div data-testid="forbidden-page">Forbidden</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

const authenticatedState = {
  user: { _id: '1', firstName: 'Test', lastName: 'User', role: 'admin', email: 'a@b.com' },
  accessToken: 'valid-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

const unauthenticatedState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    const store = createStore(authenticatedState);
    renderWithRoute(store, '/dashboard', ['all']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    const store = createStore(unauthenticatedState);
    renderWithRoute(store, '/dashboard', ['all']);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects to /403 when role insufficient', () => {
    const developerState = {
      ...authenticatedState,
      user: { ...authenticatedState.user, role: 'developer' },
    };
    const store = createStore(developerState);
    renderWithRoute(store, '/dashboard', ['super_admin', 'admin']);
    expect(screen.getByTestId('forbidden-page')).toBeInTheDocument();
  });

  it('renders when role matches requirement', () => {
    const store = createStore(authenticatedState);
    renderWithRoute(store, '/dashboard', ['admin', 'manager']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders when requiredRoles includes "all"', () => {
    const developerState = {
      ...authenticatedState,
      user: { ...authenticatedState.user, role: 'developer' },
    };
    const store = createStore(developerState);
    renderWithRoute(store, '/dashboard', ['all']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
