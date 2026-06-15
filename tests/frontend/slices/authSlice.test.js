import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  clearCredentials,
  setAuthLoading,
  setAuthError,
  selectCurrentUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectUserRole,
} from '@/features/auth/authSlice';

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'Test',
  lastName: 'Admin',
  email: 'admin@test.com',
  role: 'admin',
};

describe('authSlice', () => {
  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setCredentials', () => {
    it('sets user, accessToken, and isAuthenticated', () => {
      const state = authReducer(
        initialState,
        setCredentials({ user: mockUser, accessToken: 'test-token-123' })
      );
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test-token-123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearCredentials', () => {
    it('resets all state to initial values', () => {
      const loggedInState = {
        user: mockUser,
        accessToken: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: 'some error',
      };
      const state = authReducer(loggedInState, clearCredentials());
      expect(state).toEqual(initialState);
    });
  });

  describe('setAuthLoading', () => {
    it('sets isLoading flag', () => {
      const state = authReducer(initialState, setAuthLoading(true));
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setAuthError', () => {
    it('sets error message', () => {
      const state = authReducer(initialState, setAuthError('Login failed'));
      expect(state.error).toBe('Login failed');
    });
  });

  describe('selectors', () => {
    const rootState = {
      auth: {
        user: mockUser,
        accessToken: 'token-abc',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    };

    it('selectCurrentUser returns user', () => {
      expect(selectCurrentUser(rootState)).toEqual(mockUser);
    });

    it('selectAccessToken returns token', () => {
      expect(selectAccessToken(rootState)).toBe('token-abc');
    });

    it('selectIsAuthenticated returns true', () => {
      expect(selectIsAuthenticated(rootState)).toBe(true);
    });

    it('selectAuthLoading returns false', () => {
      expect(selectAuthLoading(rootState)).toBe(false);
    });

    it('selectUserRole returns user role', () => {
      expect(selectUserRole(rootState)).toBe('admin');
    });

    it('selectUserRole returns undefined when no user', () => {
      expect(selectUserRole({ auth: { ...rootState.auth, user: null } })).toBeUndefined();
    });
  });
});
