import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import LoadingOverlay from '../shared/LoadingOverlay';
import EnhancedAlert from '../shared/EnhancedAlert';
import { login } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// PUBLIC_INTERFACE
/**
 * Login component with Material-UI form components
 * @returns {JSX.Element} Login form component
 */
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    if (name === 'email' && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Invalid email address';
    }
    return '';
  };

  const handleChange = (e) => {
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
    
    // Validate all fields
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password)
    };

    // Filter out empty error messages
    const validationErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, value]) => value !== '')
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      setNetworkError(false);
      const { token, user } = await login(formData.email, formData.password);
      authLogin(token, user);
      navigate('/dashboard');
    } catch (err) {
      if (!navigator.onLine) {
        setNetworkError(true);
        setErrors({ submit: 'No internet connection. Please check your network.' });
      } else if (err.message === 'Failed to fetch') {
        setNetworkError(true);
        setErrors({ submit: 'Unable to connect to the server. Please try again later.' });
      } else if (err.status === 401) {
        setErrors({ submit: 'Invalid email or password.' });
      } else {
        setErrors({ submit: err.message || 'Failed to login. Please try again.' });
      }
    } finally {
      setLoading(false);
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
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            mt: 3,
            position: 'relative',
            minHeight: '250px',
            width: '100%'
          }}
        >
          {errors.submit && (
            <EnhancedAlert
              severity={networkError ? "warning" : "error"}
              message={errors.submit}
              sx={{ mb: 2 }}
            />
          )}
          <LoadingOverlay show={loading} />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.email}
            helperText={errors.email}
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.email ? 'error.main' : 'text.secondary',
                marginTop: '8px',
                fontSize: '0.875rem'
              }
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            error={!!errors.password}
            helperText={errors.password}
            sx={{
              '& .MuiFormHelperText-root': {
                color: errors.password ? 'error.main' : 'text.secondary',
                marginTop: '8px',
                fontSize: '0.875rem'
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
