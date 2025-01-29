import { setToken, getToken, setUser, getUser, isAuthenticated, logout, getAuthState } from '../utils/auth';

describe('Auth Utilities', () => {
  let mockStorage;
  let localStorageMock;

  beforeEach(() => {
    // Create a fresh storage for each test
    mockStorage = {};
    
    // Create mock functions
    const getItemMock = jest.fn(key => mockStorage[key] || null);
    const setItemMock = jest.fn((key, value) => {
      mockStorage[key] = String(value);
    });
    const removeItemMock = jest.fn(key => {
      delete mockStorage[key];
    });
    const clearMock = jest.fn(() => {
      mockStorage = {};
    });

    // Create localStorage mock object
    localStorageMock = {
      getItem: getItemMock,
      setItem: setItemMock,
      removeItem: removeItemMock,
      clear: clearMock
    };

    // Set up global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    // Clear mock storage and reset all mocks
    mockStorage = {};
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    const testToken = 'test.jwt.token';

    test('setToken should store token in localStorage', () => {
      setToken(testToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', testToken);
    });

    test('getToken should retrieve token from localStorage', () => {
      localStorage.setItem('auth_token', testToken);
      const retrievedToken = getToken();
      expect(retrievedToken).toBe(testToken);
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('User Data Management', () => {
    const testUser = { id: 1, name: 'Test User', email: 'test@example.com' };

    test('setUser should store stringified user data in localStorage', () => {
      setUser(testUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(testUser));
    });

    test('getUser should retrieve and parse user data from localStorage', () => {
      localStorage.setItem('auth_user', JSON.stringify(testUser));
      const retrievedUser = getUser();
      expect(retrievedUser).toEqual(testUser);
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_user');
    });

    test('getUser should return null when no user data exists', () => {
      const retrievedUser = getUser();
      expect(retrievedUser).toBeNull();
    });
  });

  describe('Authentication State', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNzYwOTEyMDAwfQ.S-QnFHb8YQrifHu1kqXKZuKrNtj6kF-xnJzlkenNuAE';
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNjQwOTk1MjAwfQ.2k0x6Y9rNBBrJjNcGFgekN0uB9T9KzDJU4oGHF7cZZE';

    test('isAuthenticated should return true for valid token', () => {
      setToken(validToken);
      expect(isAuthenticated()).toBe(true);
    });

    test('isAuthenticated should return false for expired token', () => {
      setToken(expiredToken);
      expect(isAuthenticated()).toBe(false);
    });

    test('isAuthenticated should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    test('logout should clear all auth data from localStorage', () => {
      setToken(validToken);
      setUser({ id: 1, name: 'Test User' });
      
      logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });

    test('getAuthState should return complete auth state', () => {
      const testUser = { id: 1, name: 'Test User' };
      setToken(validToken);
      setUser(testUser);

      const authState = getAuthState();
      expect(authState).toEqual({
        isAuthenticated: true,
        user: testUser,
        token: validToken
      });
    });
  });
});
