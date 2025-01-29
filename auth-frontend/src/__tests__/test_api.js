import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api, { login, register, refreshAccessToken } from '../utils/api';
import { getToken, setToken, setUser, logout } from '../utils/auth';

// Create a new instance of axios for testing
const axiosInstance = axios.create();

// Create mock adapter for the axios instance
const mockAxios = new MockAdapter(axiosInstance);

// Mock the auth module
jest.mock('../utils/auth', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(),
  setUser: jest.fn(),
  logout: jest.fn()
}));

// Mock the axios create function to return our test instance
jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  create: jest.fn(() => axiosInstance)
}));

describe('API Utilities', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('API Instance Configuration', () => {
    test('should add auth token to request headers when token exists', async () => {
      const token = 'test-token';
      getToken.mockReturnValue(token);

      mockAxios.onGet('/test').reply(200);
      await api.get('/test');

      expect(mockAxios.history.get[0].headers.Authorization).toBe(`Bearer ${token}`);
    });

    test('should not add auth token to request headers when token does not exist', async () => {
      getToken.mockReturnValue(null);

      mockAxios.onGet('/test').reply(200);
      await api.get('/test');

      expect(mockAxios.history.get[0].headers.Authorization).toBeUndefined();
    });
  });

  describe('Authentication Endpoints', () => {
    describe('login', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const loginResponse = {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com' }
      };

      test('should successfully login and store auth data', async () => {
        mockAxios.onPost('/auth/login').reply(200, loginResponse);

        const response = await login(loginData.email, loginData.password);

        expect(response).toEqual(loginResponse);
        expect(setToken).toHaveBeenCalledWith(loginResponse.token);
        expect(setUser).toHaveBeenCalledWith(loginResponse.user);
      });

      test('should handle login failure', async () => {
        const errorResponse = {
          message: 'Invalid credentials'
        };
        mockAxios.onPost('/auth/login').reply(401, errorResponse);

        await expect(login(loginData.email, loginData.password))
          .rejects
          .toThrow('Invalid credentials');
      });
    });

    describe('register', () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const registerResponse = {
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      };

      test('should successfully register and store auth data', async () => {
        mockAxios.onPost('/auth/register').reply(200, registerResponse);

        const response = await register(registerData);

        expect(response).toEqual(registerResponse);
        expect(setToken).toHaveBeenCalledWith(registerResponse.token);
        expect(setUser).toHaveBeenCalledWith(registerResponse.user);
      });

      test('should handle registration failure', async () => {
        const errorResponse = {
          message: 'Email already exists'
        };
        mockAxios.onPost('/auth/register').reply(400, errorResponse);

        await expect(register(registerData))
          .rejects
          .toThrow('Email already exists');
      });
    });

    describe('Token Refresh', () => {
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';

      test('should successfully refresh token', async () => {
        mockAxios.onPost('/auth/refresh').reply(200, { token: newToken });

        const response = await refreshAccessToken(refreshToken);
        expect(response.data.token).toBe(newToken);
      });

      test('should handle refresh failure and logout', async () => {
        mockAxios.onPost('/auth/refresh').reply(401, { message: 'Invalid refresh token' });

        await expect(refreshAccessToken(refreshToken))
          .rejects
          .toThrow('Invalid refresh token');
      });

      test('should handle network errors during refresh', async () => {
        mockAxios.onPost('/auth/refresh').networkError();

        await expect(refreshAccessToken(refreshToken))
          .rejects
          .toThrow('No response received from server');
      });
    });
  });

  describe('Error Handling', () => {
    test('should transform server errors', async () => {
      const errorResponse = {
        message: 'Custom error message',
        status: 400
      };
      mockAxios.onGet('/test').reply(400, errorResponse);

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.message).toBe('Custom error message');
        expect(error.status).toBe(400);
      }
    });

    test('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.message).toBe('No response received from server');
      }
    });
  });
});
