import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import useAuthInit from '@/hooks/useAuthInit';

// Mock axios module
vi.mock('@/lib/axios', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

function createWrapper(preloadedState) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: preloadedState || {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
    },
  });

  return function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useAuthInit', () => {
  let mockApi;

  beforeEach(async () => {
    mockApi = (await import('@/lib/axios')).default;
    vi.clearAllMocks();
  });

  it('calls /api/auth/refresh on mount', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('No session'));
    const wrapper = createWrapper();

    renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh');
    });
  });

  it('sets user in Redux on successful refresh + /me', async () => {
    const mockUser = {
      _id: '123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      role: 'admin',
    };

    mockApi.post.mockResolvedValueOnce({
      data: { data: { accessToken: 'new-token' } },
    });
    mockApi.get.mockResolvedValueOnce({
      data: { data: mockUser },
    });

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
      },
    });

    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.isInitialised).toBe(true);
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('new-token');
  });

  it('clears state on failed refresh (401)', async () => {
    mockApi.post.mockRejectedValueOnce({ response: { status: 401 } });

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: { _id: 'old' },
          accessToken: 'old-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      },
    });

    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuthInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.isInitialised).toBe(true);
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
