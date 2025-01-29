import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as authUtils from '../utils/auth';

// Mock the auth utilities
jest.mock('../utils/auth');

describe('AuthContext', () => {
  // Mock data
  const mockToken = 'mock-jwt-token';
  const mockUser = { id: 1, username: 'testuser' };
  const mockAuthState = {
    isAuthenticated: true,
    user: mockUser,
    token: mockToken
  };

  // Setup and cleanup
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    authUtils.getAuthState.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null
    });
  });

  describe('Context provider initialization', () => {
    it('should initialize with default auth state', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining({
          isAuthenticated: false,
          user: null,
          token: null
        })
      );
    });

    it('should throw error when useAuth is used outside provider', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div>{auth.isAuthenticated}</div>;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');
      consoleSpy.mockRestore();
    });
  });

  describe('Login functionality', () => {
    it('should update auth state on successful login', () => {
      authUtils.getAuthState.mockReturnValueOnce(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.login(mockToken, mockUser);
        }, []);
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(authUtils.setToken).toHaveBeenCalledWith(mockToken);
      expect(authUtils.setUser).toHaveBeenCalledWith(mockUser);
      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(mockAuthState)
      );
    });
  });

  describe('Logout functionality', () => {
    it('should clear auth state on logout', () => {
      const loggedOutState = {
        isAuthenticated: false,
        user: null,
        token: null
      };

      authUtils.getAuthState
        .mockReturnValueOnce(mockAuthState)
        .mockReturnValueOnce(loggedOutState);

      const TestComponent = () => {
        const auth = useAuth();
        React.useEffect(() => {
          auth.logout();
        }, []);
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(authUtils.logout).toHaveBeenCalled();
      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(loggedOutState)
      );
    });
  });

  describe('Authentication state persistence', () => {
    it('should load persisted auth state on mount', () => {
      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(mockAuthState)
      );
    });

    it('should update auth state when storage changes', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        token: null
      };

      authUtils.getAuthState
        .mockReturnValueOnce(initialState)
        .mockReturnValueOnce(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate storage change
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'auth_token',
          newValue: mockToken
        }));
      });

      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(mockAuthState)
      );
    });
  });

  describe('Role-based Access Control', () => {
    it('should correctly check single role requirement', () => {
      const mockAuthState = {
        isAuthenticated: true,
        user: { id: 1, username: 'admin', roles: ['admin'] },
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="has-admin">{auth.hasRequiredRoles(['admin']).toString()}</div>
            <div data-testid="has-user">{auth.hasRequiredRoles(['user']).toString()}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('has-admin').textContent).toBe('true');
      expect(getByTestId('has-user').textContent).toBe('false');
    });

    it('should handle multiple roles with AND logic', () => {
      const mockAuthState = {
        isAuthenticated: true,
        user: { id: 1, username: 'admin', roles: ['admin', 'manager'] },
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="has-both">
              {auth.hasRequiredRoles(['admin', 'manager'], true).toString()}
            </div>
            <div data-testid="has-one-missing">
              {auth.hasRequiredRoles(['admin', 'user'], true).toString()}
            </div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('has-both').textContent).toBe('true');
      expect(getByTestId('has-one-missing').textContent).toBe('false');
    });

    it('should handle multiple roles with OR logic', () => {
      const mockAuthState = {
        isAuthenticated: true,
        user: { id: 1, username: 'admin', roles: ['admin'] },
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="has-any">
              {auth.hasRequiredRoles(['admin', 'user'], false).toString()}
            </div>
            <div data-testid="has-none">
              {auth.hasRequiredRoles(['manager', 'user'], false).toString()}
            </div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('has-any').textContent).toBe('true');
      expect(getByTestId('has-none').textContent).toBe('false');
    });

    it('should handle empty roles array', () => {
      const mockAuthState = {
        isAuthenticated: true,
        user: { id: 1, username: 'admin', roles: ['admin'] },
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div data-testid="empty-roles">
            {auth.hasRequiredRoles([]).toString()}
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('empty-roles').textContent).toBe('false');
    });

    it('should handle missing user roles', () => {
      const mockAuthState = {
        isAuthenticated: true,
        user: { id: 1, username: 'admin' }, // No roles property
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(mockAuthState);

      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div data-testid="missing-roles">
            {auth.hasRequiredRoles(['admin']).toString()}
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('missing-roles').textContent).toBe('false');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid token gracefully', () => {
      const invalidState = {
        isAuthenticated: false,
        user: null,
        token: 'invalid-token'
      };

      authUtils.getAuthState.mockReturnValue(invalidState);

      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(invalidState)
      );
    });

    it('should handle missing user data gracefully', () => {
      const stateWithoutUser = {
        isAuthenticated: true,
        user: null,
        token: mockToken
      };

      authUtils.getAuthState.mockReturnValue(stateWithoutUser);

      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-state">{JSON.stringify(auth)}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(JSON.parse(getByTestId('auth-state').textContent)).toEqual(
        expect.objectContaining(stateWithoutUser)
      );
    });
  });
});
