/**
 * useLesson hook - Manages lesson state and progress
 */

import { useState, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3008';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  published: boolean;
}

interface LessonProgress {
  completionPercentage: number;
  timeSpent: number;
  bookmark?: number;
  completedAt?: Date;
}

interface LessonState {
  lessons: Lesson[];
  currentLesson: Lesson | null;
  progress: LessonProgress | null;
  loading: boolean;
  error: string | null;
}

export const useLesson = () => {
  const [state, setState] = useState<LessonState>({
    lessons: [],
    currentLesson: null,
    progress: null,
    loading: false,
    error: null,
  });

  // Fetch lessons for a course
  const fetchLessons = useCallback(async (courseId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get(`/api/lessons/${courseId}`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          lessons: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch lessons';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get lesson details
  const getLesson = useCallback(async (lessonId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get(`/api/lessons/detail/${lessonId}`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          currentLesson: response.data.data,
          loading: false,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch lesson';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Get lesson progress
  const getProgress = useCallback(async (lessonId: string) => {
    try {
      const response = await apiClient.get(`/api/lessons/${lessonId}/progress`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          progress: response.data.data,
        }));
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch progress';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update lesson progress
  const updateProgress = useCallback(
    async (
      lessonId: string,
      progress: { completionPercentage: number; timeSpent?: number; bookmark?: number; completed?: boolean }
    ) => {
      try {
        const response = await apiClient.post(`/api/lessons/${lessonId}/progress`, progress);

        if (response.data.success) {
          setState((prev) => ({
            ...prev,
            progress: response.data.data,
          }));
          return { success: true, data: response.data.data };
        }
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : 'Failed to update progress';
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Mark lesson complete
  const markComplete = useCallback(
    async (lessonId: string) => {
      return updateProgress(lessonId, {
        completionPercentage: 100,
        completed: true,
      });
    },
    [updateProgress]
  );

  // Get course progress
  const getCourseProgress = useCallback(async (courseId: string) => {
    try {
      const response = await apiClient.get(`/api/courses/${courseId}/progress`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : 'Failed to fetch course progress';
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    ...state,
    fetchLessons,
    getLesson,
    getProgress,
    updateProgress,
    markComplete,
    getCourseProgress,
    setCurrentLesson: (lesson: Lesson | null) => setState((prev) => ({ ...prev, currentLesson: lesson })),
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
};
