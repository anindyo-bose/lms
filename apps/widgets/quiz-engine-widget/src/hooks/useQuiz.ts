/**
 * useQuiz Hook - Quiz state management
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Quiz, QuizAttempt, QuizAnswer, QuizResult } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3008';

interface UseQuizReturn {
  quiz: Quiz | null;
  attempt: QuizAttempt | null;
  result: QuizResult | null;
  loading: boolean;
  error: string | null;

  // Quiz operations
  fetchQuiz: (quizId: string) => Promise<void>;
  fetchQuizByLesson: (lessonId: string) => Promise<void>;

  // Attempt operations
  startAttempt: (quizId: string) => Promise<QuizAttempt | null>;
  submitAnswer: (questionId: string, answer: QuizAnswer) => void;
  submitQuiz: () => Promise<QuizResult | null>;
  getAttempts: (quizId: string) => Promise<QuizAttempt[]>;
  getResult: (attemptId: string) => Promise<QuizResult | null>;

  // State management
  answers: Record<string, QuizAnswer>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, QuizAnswer>>>;
  clearQuiz: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz by ID
  const fetchQuiz = useCallback(async (quizId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/quizzes/${quizId}`, {
        withCredentials: true,
      });
      setQuiz(response.data.quiz);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch quiz';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch quiz by lesson ID
  const fetchQuizByLesson = useCallback(async (lessonId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/quizzes/lesson/${lessonId}`, {
        withCredentials: true,
      });
      setQuiz(response.data.quiz);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        const message = err.response?.data?.message || 'Failed to fetch quiz';
        setError(message);
      }
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start a quiz attempt
  const startAttempt = useCallback(async (quizId: string): Promise<QuizAttempt | null> => {
    setLoading(true);
    setError(null);
    setAnswers({});
    setResult(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/quizzes/${quizId}/attempts`,
        {},
        { withCredentials: true }
      );
      const newAttempt = response.data.attempt;
      setAttempt(newAttempt);
      return newAttempt;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to start quiz';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit answer for a question (local state only)
  const submitAnswer = useCallback((questionId: string, answer: QuizAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  // Submit completed quiz
  const submitQuiz = useCallback(async (): Promise<QuizResult | null> => {
    if (!attempt) {
      setError('No active quiz attempt');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/quizzes/attempts/${attempt.id}/submit`,
        { answers: Object.values(answers) },
        { withCredentials: true }
      );
      const quizResult = response.data.result;
      setResult(quizResult);
      setAttempt(null);
      return quizResult;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit quiz';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempt, answers]);

  // Get all attempts for a quiz
  const getAttempts = useCallback(async (quizId: string): Promise<QuizAttempt[]> => {
    try {
      const response = await axios.get(`${API_BASE}/api/quizzes/${quizId}/attempts`, {
        withCredentials: true,
      });
      return response.data.attempts;
    } catch (err: any) {
      console.error('Failed to fetch attempts:', err);
      return [];
    }
  }, []);

  // Get result for a specific attempt
  const getResult = useCallback(async (attemptId: string): Promise<QuizResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/api/quizzes/attempts/${attemptId}/result`, {
        withCredentials: true,
      });
      const quizResult = response.data.result;
      setResult(quizResult);
      return quizResult;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch result';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear quiz state
  const clearQuiz = useCallback(() => {
    setQuiz(null);
    setAttempt(null);
    setResult(null);
    setAnswers({});
    setError(null);
  }, []);

  return {
    quiz,
    attempt,
    result,
    loading,
    error,
    fetchQuiz,
    fetchQuizByLesson,
    startAttempt,
    submitAnswer,
    submitQuiz,
    getAttempts,
    getResult,
    answers,
    setAnswers,
    clearQuiz,
  };
}
