import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthState, setToken, logout } from '../utils/auth';

// Create the context
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value containing authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// PUBLIC_INTERFACE
/**
 * Authentication provider component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => getAuthState());
  const [isLoading, setIsLoading] = useState(true);

  // Update auth state when token or user changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const newState = getAuthState();
        setAuthState(newState);
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // PUBLIC_INTERFACE
  /**
   * Updates the authentication state with new token and user data
   * @param {string} token - JWT token
   * @param {Object} user - User data
   */
  const login = async (token, user) => {
    try {
      setIsLoading(true);
      setToken(token);
      setAuthState(getAuthState());
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Clears authentication state
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      logout();
      setAuthState(getAuthState());
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Checks if the user has the required roles
   * @param {string[]} requiredRoles - Array of required roles
   * @param {boolean} requireAll - If true, user must have all required roles
   * @returns {boolean} Whether the user has the required roles
   */
  const hasRequiredRoles = (requiredRoles, requireAll = false) => {
    if (!authState.user?.roles || !requiredRoles.length) {
      return false;
    }

    return requireAll
      ? requiredRoles.every(role => authState.user.roles.includes(role))
      : requiredRoles.some(role => authState.user.roles.includes(role));
  };

  const value = {
    ...authState,
    isLoading,
    login,
    logout: handleLogout,
    hasRequiredRoles
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
