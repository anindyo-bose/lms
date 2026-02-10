/**
 * useProgress Hook - Progress tracking state management
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { LearningProgress, LearningActivity, WeeklyStats, CourseProgressDetail } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3008';

interface UseProgressReturn {
  progress: LearningProgress | null;
  activities: LearningActivity[];
  weeklyStats: WeeklyStats[];
  loading: boolean;
  error: string | null;

  // Data fetching
  fetchProgress: () => Promise<void>;
  fetchActivities: (limit?: number) => Promise<void>;
  fetchWeeklyStats: (weeks?: number) => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<CourseProgressDetail | null>;

  // Refresh
  refresh: () => Promise<void>;
}

export function useProgress(): UseProgressReturn {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch overall learning progress
  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/progress/overview`, {
        withCredentials: true,
      });
      setProgress(response.data.progress);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch progress';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recent learning activities
  const fetchActivities = useCallback(async (limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE}/api/progress/activities`, {
        params: { limit },
        withCredentials: true,
      });
      setActivities(response.data.activities);
    } catch (err: any) {
      console.error('Failed to fetch activities:', err);
    }
  }, []);

  // Fetch weekly stats
  const fetchWeeklyStats = useCallback(async (weeks = 8) => {
    try {
      const response = await axios.get(`${API_BASE}/api/progress/weekly`, {
        params: { weeks },
        withCredentials: true,
      });
      setWeeklyStats(response.data.stats);
    } catch (err: any) {
      console.error('Failed to fetch weekly stats:', err);
    }
  }, []);

  // Fetch progress for a specific course
  const fetchCourseProgress = useCallback(async (courseId: string): Promise<CourseProgressDetail | null> => {
    try {
      const response = await axios.get(`${API_BASE}/api/progress/course/${courseId}`, {
        withCredentials: true,
      });
      return response.data.progress;
    } catch (err: any) {
      console.error('Failed to fetch course progress:', err);
      return null;
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchProgress(),
        fetchActivities(),
        fetchWeeklyStats(),
      ]);
    } catch (err: any) {
      setError('Failed to refresh progress data');
    } finally {
      setLoading(false);
    }
  }, [fetchProgress, fetchActivities, fetchWeeklyStats]);

  return {
    progress,
    activities,
    weeklyStats,
    loading,
    error,
    fetchProgress,
    fetchActivities,
    fetchWeeklyStats,
    fetchCourseProgress,
    refresh,
  };
}
