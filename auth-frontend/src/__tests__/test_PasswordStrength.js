import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../components/Register/Register';
import { AuthProvider } from '../context/AuthContext';

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

describe('Password Strength Visualization Tests', () => {
  beforeEach(() => {
    renderWithProviders(<Register />);
  });

  test('password strength meter should not be visible initially', () => {
    const strengthMeter = screen.queryByRole('progressbar', { 
      name: /password strength indicator/i 
    });
    expect(strengthMeter).not.toBeInTheDocument();
  });

  test('password strength meter should appear when password is entered', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'test' } });
    
    const strengthMeter = screen.getByRole('progressbar', {
      name: /password strength indicator/i
    });
    expect(strengthMeter).toBeInTheDocument();
  });

  test('should show correct strength for weak password', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/weak password/i)).toBeInTheDocument();
  });

  test('should show correct strength for password with only length requirement', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'longpassword' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText(/add special characters/i)).toBeInTheDocument();
  });

  test('should show correct strength for password with length and numbers', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '50');
  });

  test('should show correct strength for password with length, numbers, and special chars', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'password123!' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '75');
  });

  test('should show correct strength for strong password', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(/strong password/i)).toBeInTheDocument();
  });

  test('should update feedback text based on missing requirements', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    
    // Test for length requirement feedback
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(screen.getByText(/add more characters/i)).toBeInTheDocument();
    
    // Test for special character requirement feedback
    fireEvent.change(passwordInput, { target: { value: 'longpassword123' } });
    expect(screen.getByText(/add special characters/i)).toBeInTheDocument();
  });

  test('should be accessible with proper ARIA attributes', () => {
    const passwordInput = screen.getByLabelText(/password input field/i);
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    
    const strengthMeter = screen.getByRole('progressbar');
    expect(strengthMeter).toHaveAttribute('aria-valuemin', '0');
    expect(strengthMeter).toHaveAttribute('aria-valuemax', '100');
    expect(strengthMeter).toHaveAttribute('aria-valuenow', '100');
  });
});