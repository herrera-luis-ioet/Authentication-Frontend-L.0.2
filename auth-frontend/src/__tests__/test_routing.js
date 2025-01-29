import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import App from '../App';
import theme from '../theme';
import * as auth from '../utils/auth';

// Mock the auth module
jest.mock('../utils/auth');

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('Routing Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Protected Route Tests', () => {
    test('redirects to login when accessing protected route while not authenticated', async () => {
      auth.isAuthenticated.mockReturnValue(false);
      renderWithRouter('/dashboard');
      
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    test('allows access to dashboard when authenticated', async () => {
      auth.isAuthenticated.mockReturnValue(true);
      renderWithRouter('/dashboard');

      expect(await screen.findByText('Welcome! You are logged in.')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Authentication State Based Navigation', () => {
    test('redirects to dashboard when accessing login while authenticated', async () => {
      auth.isAuthenticated.mockReturnValue(true);
      renderWithRouter('/login');

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    test('redirects to dashboard when accessing register while authenticated', async () => {
      auth.isAuthenticated.mockReturnValue(true);
      renderWithRouter('/register');

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    test('redirects to dashboard when accessing root while authenticated', async () => {
      auth.isAuthenticated.mockReturnValue(true);
      renderWithRouter('/');

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });
  });

  describe('Public Route Access', () => {
    test('shows login page when not authenticated', () => {
      auth.isAuthenticated.mockReturnValue(false);
      renderWithRouter('/login');

      expect(screen.getByRole('heading', { name: /user registration and login/i })).toBeInTheDocument();
    });

    test('shows register page when not authenticated', () => {
      auth.isAuthenticated.mockReturnValue(false);
      renderWithRouter('/register');

      expect(screen.getByRole('heading', { name: /user registration and login/i })).toBeInTheDocument();
    });

    test('shows login and register buttons on root when not authenticated', () => {
      auth.isAuthenticated.mockReturnValue(false);
      renderWithRouter('/');

      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });
  });
});
