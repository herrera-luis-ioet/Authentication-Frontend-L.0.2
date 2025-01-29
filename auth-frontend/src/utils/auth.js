// Constants for localStorage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// PUBLIC_INTERFACE
/**
 * Stores the JWT token in localStorage
 * @param {string} token - The JWT token to store
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// PUBLIC_INTERFACE
/**
 * Retrieves the JWT token from localStorage
 * @returns {string|null} The stored JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// PUBLIC_INTERFACE
/**
 * Stores the user data in localStorage
 * @param {Object} user - The user object to store
 */

// PUBLIC_INTERFACE
/**
 * Retrieves the user data from localStorage
 * @returns {Object|null} The stored user object or null if not found
 */

// PUBLIC_INTERFACE
/**
 * Checks if the user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token && !isTokenExpired(token);
};

// PUBLIC_INTERFACE
/**
 * Clears all authentication data from localStorage
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if the token is expired, false otherwise
 */
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 < Date.now() : false;
  } catch (e) {
    return true;
  }
};

// PUBLIC_INTERFACE
/**
 * Gets the authentication state
 * @returns {Object} Object containing authentication state and user data
 */
export const getAuthState = () => {
  return {
    isAuthenticated: isAuthenticated(),
    token: getToken()
  };
};