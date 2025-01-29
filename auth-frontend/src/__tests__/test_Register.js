import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import Register from '../components/Register/Register';
import { register as registerApi } from '../utils/api';

// Mock the api module
jest.mock('../utils/api', () => ({
  register: jest.fn()
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

expect.extend(toHaveNoViolations);

// Custom render function that wraps component with mocked router
const renderWithMocks = (ui) => {
  return render(ui);
};

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithMocks(<Register />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria-labels for form fields', () => {
      renderWithMocks(<Register />);
      
      expect(screen.getByLabelText('Email input field')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('Password input field')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('Confirm password input field')).toHaveAttribute('aria-required', 'true');
    });

    it('should announce form validation errors', async () => {
      renderWithMocks(<Register />);
      
      const emailInput = screen.getByLabelText('Email input field');
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      const emailError = await screen.findByText('Invalid email address');
      expect(emailError).toHaveAttribute('role', 'alert');
      expect(emailError).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce API errors to screen readers', async () => {
      const errorMessage = 'Email already exists';
      registerApi.mockRejectedValueOnce(new Error(errorMessage));
      
      renderWithMocks(<Register />);
      
      fireEvent.change(screen.getByLabelText('Email input field'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password input field'), {
        target: { value: 'Password123!' }
      });
      fireEvent.change(screen.getByLabelText('Confirm password input field'), {
        target: { value: 'Password123!' }
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(errorMessage);
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should maintain keyboard focus during form interaction', () => {
      renderWithMocks(<Register />);
      
      const emailInput = screen.getByLabelText('Email input field');
      const passwordInput = screen.getByLabelText('Password input field');
      const confirmPasswordInput = screen.getByLabelText('Confirm password input field');
      const submitButton = screen.getByRole('button', { name: /register/i });

      // Test tab order
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(passwordInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(confirmPasswordInput);
      
      userEvent.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('should announce loading state to screen readers', async () => {
      registerApi.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithMocks(<Register />);
      
      // Fill form with valid data
      fireEvent.change(screen.getByLabelText('Email input field'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText('Password input field'), {
        target: { value: 'Password123!' }
      });
      fireEvent.change(screen.getByLabelText('Confirm password input field'), {
        target: { value: 'Password123!' }
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Verify loading indicator is announced
      const loadingSpinner = await screen.findByRole('progressbar');
      expect(loadingSpinner).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeDisabled();
    });
  });

  it('renders registration form correctly', () => {
    renderWithMocks(<Register />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithMocks(<Register />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
  });

  it('validates password requirements', async () => {
    renderWithMocks(<Register />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Test password length
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();

    // Test password complexity
    fireEvent.change(passwordInput, { target: { value: 'longpassword' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText('Password must contain at least one number and one special character')).toBeInTheDocument();
  });

  it('validates password confirmation matching', async () => {
    renderWithMocks(<Register />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    registerApi.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithMocks(<Register />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('handles successful registration', async () => {
    registerApi.mockResolvedValueOnce({ user: { email: 'test@example.com' } });
    
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(registerApi).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on registration failure', async () => {
    const errorMessage = 'Email already exists';
    registerApi.mockRejectedValueOnce(new Error(errorMessage));
    
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clears field-specific errors when user starts typing', () => {
    renderWithMocks(<Register />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Trigger validation error
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    // Verify error is shown
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();

    // Start typing again
    fireEvent.change(emailInput, { target: { value: 'test@' } });

    // Verify error is cleared
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
  });
});
