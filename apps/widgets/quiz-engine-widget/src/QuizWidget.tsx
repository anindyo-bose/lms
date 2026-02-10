/**
 * QuizWidget Component - Main quiz engine widget
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useQuiz } from './hooks/useQuiz';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResults } from './components/QuizResults';
import styles from './QuizWidget.module.css';

interface QuizWidgetProps {
  quizId?: string;
  lessonId?: string;
  onComplete?: (result: { passed: boolean; score: number; percentage: number }) => void;
  onClose?: () => void;
}

type View = 'intro' | 'playing' | 'results';

export const QuizWidget: React.FC<QuizWidgetProps> = ({
  quizId,
  lessonId,
  onComplete,
  onClose,
}) => {
  const {
    quiz,
    attempt,
    result,
    loading,
    error,
    answers,
    fetchQuiz,
    fetchQuizByLesson,
    startAttempt,
    submitAnswer,
    submitQuiz,
    getAttempts,
    clearQuiz,
  } = useQuiz();

  const [view, setView] = useState<View>('intro');
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load quiz
  useEffect(() => {
    if (quizId) {
      fetchQuiz(quizId);
    } else if (lessonId) {
      fetchQuizByLesson(lessonId);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId, lessonId, fetchQuiz, fetchQuizByLesson]);

  // Load previous attempts
  useEffect(() => {
    if (quiz?.id) {
      getAttempts(quiz.id).then(setPreviousAttempts);
    }
  }, [quiz?.id, getAttempts]);

  // Timer effect
  useEffect(() => {
    if (view === 'playing' && quiz?.timeLimit && attempt) {
      const startTime = new Date(attempt.startedAt).getTime();
      const endTime = startTime + quiz.timeLimit * 60 * 1000;

      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0) {
          handleSubmit();
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [view, quiz?.timeLimit, attempt]);

  // Handle start quiz
  const handleStart = useCallback(async () => {
    if (!quiz) return;

    const newAttempt = await startAttempt(quiz.id);
    if (newAttempt) {
      setView('playing');
    }
  }, [quiz, startAttempt]);

  // Handle submit quiz
  const handleSubmit = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const quizResult = await submitQuiz();
    if (quizResult) {
      setView('results');
      onComplete?.({
        passed: quizResult.passed,
        score: quizResult.score,
        percentage: quizResult.percentage,
      });
    }
  }, [submitQuiz, onComplete]);

  // Handle retry
  const handleRetry = useCallback(() => {
    clearQuiz();
    setView('intro');
    if (quizId) {
      fetchQuiz(quizId);
    } else if (lessonId) {
      fetchQuizByLesson(lessonId);
    }
  }, [clearQuiz, quizId, lessonId, fetchQuiz, fetchQuizByLesson]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    clearQuiz();
    setView('intro');
    onClose?.();
  }, [clearQuiz, onClose]);

  // Check if can retry
  const canRetry =
    !quiz?.maxAttempts || previousAttempts.length < quiz.maxAttempts;

  // Loading state
  if (loading && !quiz) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading quiz...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={handleCancel} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // No quiz found
  if (!quiz) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3>No Quiz Available</h3>
          <p>There is no quiz for this lesson.</p>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // Intro view
  if (view === 'intro') {
    return (
      <div className={styles.container}>
        <div className={styles.intro}>
          <h2 className={styles.title}>{quiz.title}</h2>
          <p className={styles.description}>{quiz.description}</p>

          <div className={styles.quizInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Questions</span>
              <span className={styles.infoValue}>{quiz.questions.length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Passing Score</span>
              <span className={styles.infoValue}>{quiz.passingScore}%</span>
            </div>
            {quiz.timeLimit && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Time Limit</span>
                <span className={styles.infoValue}>{quiz.timeLimit} min</span>
              </div>
            )}
            {quiz.maxAttempts && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Attempts</span>
                <span className={styles.infoValue}>
                  {previousAttempts.length}/{quiz.maxAttempts}
                </span>
              </div>
            )}
          </div>

          {previousAttempts.length > 0 && (
            <div className={styles.previousAttempts}>
              <h4>Previous Attempts</h4>
              <ul>
                {previousAttempts.slice(-3).map((att, i) => (
                  <li key={att.id}>
                    Attempt {i + 1}: {att.score}% -{' '}
                    {att.passed ? (
                      <span className={styles.passed}>Passed</span>
                    ) : (
                      <span className={styles.failed}>Failed</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            {onClose && (
              <button onClick={onClose} className={styles.cancelButton}>
                Cancel
              </button>
            )}
            <button
              onClick={handleStart}
              className={styles.startButton}
              disabled={!canRetry || loading}
            >
              {previousAttempts.length > 0 ? 'Retry Quiz' : 'Start Quiz'}
            </button>
          </div>

          {!canRetry && (
            <p className={styles.maxAttemptsWarning}>
              You have reached the maximum number of attempts for this quiz.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Playing view
  if (view === 'playing' && quiz) {
    return (
      <div className={styles.container}>
        <QuizPlayer
          quiz={quiz}
          answers={answers}
          onAnswer={submitAnswer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          timeRemaining={timeRemaining}
          loading={loading}
        />
      </div>
    );
  }

  // Results view
  if (view === 'results' && result) {
    return (
      <div className={styles.container}>
        <QuizResults
          result={result}
          quiz={quiz}
          onRetry={canRetry ? handleRetry : undefined}
          onContinue={onClose}
          allowRetry={canRetry}
        />
      </div>
    );
  }

  return null;
};

export default QuizWidget;
