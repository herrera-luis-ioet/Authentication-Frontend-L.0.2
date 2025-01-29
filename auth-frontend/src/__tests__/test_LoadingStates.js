import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/Register/Register';
import { AuthProvider } from '../context/AuthContext';
import { register } from '../utils/api';

// Mock the API module
jest.mock('../utils/api', () => ({
  register: jest.fn()
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Wrap component with required providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Loading States Tests', () => {
  beforeEach(() => {
    renderWithProviders(<Register />);
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('loading indicator should not be visible initially', () => {
    const submitButton = screen.getByRole('button', { name: /submit registration form/i });
    expect(submitButton).toHaveTextContent(/register/i);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('loading indicator should appear during form submission', async () => {
    // Mock successful registration
    register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email input field/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password input field/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password input field/i), {
      target: { value: 'Password123!' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit registration form/i }));

    // Check if loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('form inputs should be disabled during loading', async () => {
    // Mock slow registration
    register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email input field/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password input field/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password input field/i), {
      target: { value: 'Password123!' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit registration form/i }));

    // Check if inputs are disabled
    expect(screen.getByLabelText(/email input field/i)).toBeDisabled();
    expect(screen.getByLabelText(/password input field/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password input field/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit registration form/i })).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/email input field/i)).not.toBeDisabled();
    });
  });

  test('loading state should handle network errors correctly', async () => {
    // Mock network error
    register.mockRejectedValue(new Error('Failed to fetch'));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email input field/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password input field/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password input field/i), {
      target: { value: 'Password123!' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit registration form/i }));

    // Check loading indicator appears
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unable to connect to the server/i);
    });

    // Verify loading state is cleared
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit registration form/i })).not.toBeDisabled();
  });

  test('loading state should handle API errors correctly', async () => {
    // Mock API error
    const apiError = { status: 409, message: 'Email already exists' };
    register.mockRejectedValue(apiError);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email input field/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password input field/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password input field/i), {
      target: { value: 'Password123!' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit registration form/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email is already registered/i);
    });

    // Verify loading state is cleared
    expect(screen.queryByRole('progressbar')).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /submit registration form/i })).not.toBeDisabled();
  });

  test('loading timeout should be handled gracefully', async () => {
    // Mock timeout
    register.mockImplementation(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000);
    }));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email input field/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password input field/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password input field/i), {
      target: { value: 'Password123!' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit registration form/i }));

    // Check loading indicator appears
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for timeout error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed/i);
    }, { timeout: 6000 });

    // Verify loading state is cleared
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit registration form/i })).not.toBeDisabled();
  });
});