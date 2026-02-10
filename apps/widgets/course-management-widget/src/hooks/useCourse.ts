/**
 * useCourse hook - Manages course state and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3008';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

interface Course {
  id: string;
  educatorId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCoursePayload {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface UpdateCoursePayload {
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  published?: boolean;
}

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  loading: boolean;
  error: string | null;
}

export const useCourse = () => {
  const [state, setState] = useState<CourseState>({
    courses: [],
    selectedCourse: null,
    loading: false,
    error: null,
  });

  // Fetch all courses
  const fetchCourses = useCallback(async (filters?: { category?: string; level?: string }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);

      const response = await apiClient.get(`/api/courses?${params.toString()}`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          courses: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch courses';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fetch my courses (educator: created / student: enrolled)
  const fetchMyCourses = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get('/api/my-courses');

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          courses: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data, type: response.data.type };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch courses';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get single course
  const getCourse = useCallback(async (courseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get(`/api/courses/${courseId}`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          selectedCourse: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch course';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Create course
  const createCourse = useCallback(async (payload: CreateCoursePayload) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post('/api/courses', payload);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          courses: [response.data.data, ...prev.courses],
          selectedCourse: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to create course';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update course
  const updateCourse = useCallback(async (courseId: string, payload: UpdateCoursePayload) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.put(`/api/courses/${courseId}`, payload);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          courses: prev.courses.map((c) => (c.id === courseId ? response.data.data : c)),
          selectedCourse: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to update course';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete course
  const deleteCourse = useCallback(async (courseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.delete(`/api/courses/${courseId}`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          courses: prev.courses.filter((c) => c.id !== courseId),
          selectedCourse: prev.selectedCourse?.id === courseId ? null : prev.selectedCourse,
          loading: false,
        }));
        return { success: true };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to delete course';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Enroll in course (student)
  const enrollInCourse = useCallback(async (courseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post(`/api/courses/${courseId}/enroll`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to enroll';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check enrollment
  const checkEnrollment = useCallback(async (courseId: string) => {
    try {
      const response = await apiClient.get(`/api/courses/${courseId}/enrolled`);
      return { success: true, enrolled: response.data.enrolled };
    } catch (error) {
      return { success: false, enrolled: false };
    }
  }, []);

  return {
    ...state,
    fetchCourses,
    fetchMyCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    checkEnrollment,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
    setSelectedCourse: (course: Course | null) => setState((prev) => ({ ...prev, selectedCourse: course })),
  };
};
