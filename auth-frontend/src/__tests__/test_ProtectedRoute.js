import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import * as authUtils from '../utils/auth';

// Mock the auth utilities
jest.mock('../utils/auth');

// Test component to capture location state
const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="location-display">
      {JSON.stringify({ pathname: location.pathname, state: location.state })}
    </div>
  );
};

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (
  initialRoute = '/',
  { mockAuthState, mockIsLoading = false } = {}
) => {
  // Setup mock auth state
  authUtils.getAuthState.mockReturnValue(mockAuthState || {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: mockIsLoading
  });

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['admin']} redirectTo="/unauthorized">
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/multi-role"
            element={
              <ProtectedRoute
                requiredRoles={['admin', 'manager']}
                requireAllRoles={true}
              >
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    test('shows loading spinner while checking authentication', () => {
      renderWithRouter('/protected', {
        mockAuthState: {
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: true
        }
      });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('redirects to login when not authenticated', async () => {
      renderWithRouter('/protected', {
        mockAuthState: {
          isAuthenticated: false,
          user: null,
          token: null
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    test('preserves location state during redirect to login', async () => {
      renderWithRouter('/protected', {
        mockAuthState: {
          isAuthenticated: false,
          user: null,
          token: null
        }
      });

      await waitFor(() => {
        const locationData = JSON.parse(screen.getByTestId('location-display').textContent);
        expect(locationData.state.from.pathname).toBe('/protected');
      });
    });

    test('renders protected content when authenticated', () => {
      renderWithRouter('/protected', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'test' },
          token: 'valid-token'
        }
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    test('allows access when user has required role', () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'admin', roles: ['admin'] },
          token: 'valid-token'
        }
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('redirects to unauthorized when missing required role', async () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'user', roles: ['user'] },
          token: 'valid-token'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      });
    });

    test('allows access when user has all required roles', () => {
      renderWithRouter('/multi-role', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'admin', roles: ['admin', 'manager'] },
          token: 'valid-token'
        }
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('denies access when missing some required roles in AND mode', async () => {
      renderWithRouter('/multi-role', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'admin', roles: ['admin'] },
          token: 'valid-token'
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    test('handles missing roles array in user object', async () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'user' }, // No roles array
          token: 'valid-token'
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles null user object gracefully', async () => {
      renderWithRouter('/protected', {
        mockAuthState: {
          isAuthenticated: true,
          user: null,
          token: 'valid-token'
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('handles undefined roles gracefully', async () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: true,
          user: { id: 1, username: 'user', roles: undefined },
          token: 'valid-token'
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Redirect Behavior', () => {
    test('respects custom redirect path', async () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: false,
          user: null,
          token: null
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      });
    });

    test('preserves state during custom redirects', async () => {
      renderWithRouter('/admin', {
        mockAuthState: {
          isAuthenticated: false,
          user: null,
          token: null
        }
      });

      await waitFor(() => {
        const locationData = JSON.parse(screen.getByTestId('location-display').textContent);
        expect(locationData.state.from.pathname).toBe('/admin');
      });
    });
  });
});