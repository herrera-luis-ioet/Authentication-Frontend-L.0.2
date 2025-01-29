import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import LoadingOverlay from '../shared/LoadingOverlay';
import EnhancedAlert from '../shared/EnhancedAlert';
import LinearProgress from '@mui/material/LinearProgress';
import { register } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Password strength calculation
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: '' };
  
  let score = 0;
  let feedback = [];

  // Length check
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('Add more characters');
  }

  // Special character check
  if (/[!@#$%^&*]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Add special characters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 25;
  } else {
    feedback.push('Add numbers');
  }

  // Uppercase and lowercase check
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Mix upper and lowercase letters');
  }

  return {
    score,
    feedback: feedback.join(', ')
  };
};

// Form validation rules
const validateForm = (values) => {
  const errors = {};
  
  // Email validation
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  
  // Password validation
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/i.test(values.password)) {
    errors.password = 'Password must contain at least one number and one special character';
  }
  
  // Confirm password validation
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

// PUBLIC_INTERFACE
/**
 * Registration component with form validation and error handling
 * @returns {JSX.Element} Registration form component
 */
const Register = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  const handleChange = (e) => {
    // Update password strength when password field changes
    if (e.target.name === 'password') {
      setPasswordStrength(calculatePasswordStrength(e.target.value));
    }
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      setNetworkError(false);
      // Register user and get token and user data
      const { token, user } = await register({
        email: formData.email,
        password: formData.password
      });
      
      // Log in the user after successful registration
      authLogin(token, user);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      if (!navigator.onLine) {
        setNetworkError(true);
        setApiError('No internet connection. Please check your network.');
      } else if (error.message === 'Failed to fetch') {
        setNetworkError(true);
        setApiError('Unable to connect to the server. Please try again later.');
      } else if (error.status === 409) {
        setApiError('This email is already registered. Please use a different email or try logging in.');
      } else {
        setApiError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Create Your Account
        </Typography>

        {apiError && (
          <EnhancedAlert
            severity={networkError ? "warning" : "error"}
            message={apiError}
            sx={{ width: '100%', mt: 2, mb: 2 }}
          />
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            mt: 3,
            position: 'relative',
            minHeight: '450px',
            width: '100%',
            '& .MuiTextField-root': { mb: 2 },
            '& .MuiButton-root': { mt: 3, mb: 2 }
          }}
        >
          <LoadingOverlay show={isLoading} />
          <TextField
            margin="dense"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email || ' '}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby="email-helper-text"
            inputProps={{
              'aria-label': 'Email input field'
            }}
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.email ? 'error.main' : 'text.secondary',
                marginTop: '8px',
                fontSize: '0.875rem',
                minHeight: '1.25rem'
              }
            }}
            FormHelperTextProps={{
              id: 'email-helper-text',
              role: 'alert',
              'aria-live': 'polite'
            }}
          />
          <Box sx={{ width: '100%' }}>
            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || 'At least 8 characters with numbers and special characters'}
              disabled={isLoading}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby="password-helper-text password-strength"
              inputProps={{
                'aria-label': 'Password input field'
              }}
              sx={{
                '& .MuiFormHelperText-root': {
                  color: errors.password ? 'error.main' : 'text.secondary',
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  minHeight: '1.25rem'
                }
              }}
              FormHelperTextProps={{
                id: 'password-helper-text',
                role: 'alert',
                'aria-live': 'polite'
              }}
            />
            {formData.password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength.score}
                  sx={{
                    height: 8,
                    borderRadius: 5,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      backgroundColor: passwordStrength.score <= 25 ? 'error.main' :
                                     passwordStrength.score <= 50 ? 'warning.main' :
                                     passwordStrength.score <= 75 ? 'info.main' : 'success.main'
                    }
                  }}
                  aria-label="Password strength indicator"
                  role="progressbar"
                  aria-valuenow={passwordStrength.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  id="password-strength"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {passwordStrength.feedback || (
                    passwordStrength.score === 100 ? 'Strong password' :
                    passwordStrength.score >= 75 ? 'Good password' :
                    passwordStrength.score >= 50 ? 'Moderate password' :
                    'Weak password'
                  )}
                </Typography>
              </Box>
            )}
          </Box>
          <TextField
            margin="dense"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword || ' '}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirm-password-helper-text"
            inputProps={{
              'aria-label': 'Confirm password input field'
            }}
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.confirmPassword ? 'error.main' : 'text.secondary',
                marginTop: '8px',
                fontSize: '0.875rem',
                minHeight: '1.25rem'
              }
            }}
            FormHelperTextProps={{
              id: 'confirm-password-helper-text',
              role: 'alert',
              'aria-live': 'polite'
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
            aria-label="Submit registration form"
          >
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
