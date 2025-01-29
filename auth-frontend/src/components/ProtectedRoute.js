import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

// PUBLIC_INTERFACE
/**
 * A wrapper component that protects routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string} [props.redirectTo="/login"] - Path to redirect to if not authenticated
 * @param {string[]} [props.requiredRoles] - Array of roles required to access the route
 * @param {boolean} [props.requireAllRoles=false] - If true, user must have all required roles
 * @returns {React.ReactNode} Protected route component
 */
const ProtectedRoute = ({ 
  children, 
  redirectTo = "/login", 
  requiredRoles = [], 
  requireAllRoles = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isLoading) {
      // Set a timeout to show a message if loading takes too long
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // Show message after 5 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px',
          gap: 2
        }}
      >
        <CircularProgress />
        {loadingTimeout && (
          <Alert 
            severity="info"
            sx={{ maxWidth: '400px' }}
          >
            Taking longer than usual to verify your authentication. Please wait...
          </Alert>
        )}
      </Box>
    );
  }

  // Handle authentication errors
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}
      >
        <Alert 
          severity="error"
          sx={{ maxWidth: '400px' }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required roles are specified
  if (requiredRoles.length > 0 && user?.roles) {
    const hasRequiredRoles = requireAllRoles
      ? requiredRoles.every(role => user.roles.includes(role))
      : requiredRoles.some(role => user.roles.includes(role));

    if (!hasRequiredRoles) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
