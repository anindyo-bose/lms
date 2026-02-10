/**
 * useAuth hook - Manages authentication state and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';
import { IAuthWidget } from '@composey/shared-types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies
  timeout: 10000,
});

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin';
  mustChangePassword: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  });

  // Get current user from API
  const getCurrentUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        setState({
          isAuthenticated: true,
          user: response.data.user,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      // 401 is expected if not logged in
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to get user',
        }));
      }
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        setState({
          isAuthenticated: true,
          user: response.data.user,
          loading: false,
          error: null,
        });
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : error instanceof Error
            ? error.message
            : 'Login failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Signup
  const signup = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, role?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await apiClient.post('/auth/signup', {
          email,
          password,
          firstName,
          lastName,
          role,
        });
        if (response.data.success) {
          setState({
            isAuthenticated: true,
            user: response.data.user,
            loading: false,
            error: null,
          });
          return { success: true };
        }
      } catch (error) {
        const errorMessage =
          axios.isAxiosError(error) && error.response?.data?.error
            ? error.response.data.error
            : error instanceof Error
              ? error.message
              : 'Signup failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await apiClient.post('/auth/logout');
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even if logout fails
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      if (response.data.success && response.data.user) {
        setState((prev) => ({
          ...prev,
          user: response.data.user,
          loading: false,
        }));
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : error instanceof Error
            ? error.message
            : 'Password change failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return {
    ...state,
    getCurrentUser,
    login,
    signup,
    logout,
    changePassword,
  };
};
