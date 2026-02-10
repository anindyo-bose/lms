/**
 * QuizResults Component - Display quiz results and feedback
 */

import React from 'react';
import type { QuizResult, Quiz } from '../types';
import styles from './QuizResults.module.css';

interface QuizResultsProps {
  result: QuizResult;
  quiz?: Quiz;
  onRetry?: () => void;
  onContinue?: () => void;
  onViewDetails?: () => void;
  allowRetry?: boolean;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  quiz,
  onRetry,
  onContinue,
  onViewDetails,
  allowRetry = true,
}) => {
  const percentage = Math.round(result.percentage);
  const passingScore = quiz?.passingScore || 70;

  // Determine grade and color
  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A', color: '#10b981', label: 'Excellent!' };
    if (pct >= 80) return { grade: 'B', color: '#3b82f6', label: 'Great job!' };
    if (pct >= 70) return { grade: 'C', color: '#f59e0b', label: 'Good work!' };
    if (pct >= 60) return { grade: 'D', color: '#f97316', label: 'Needs improvement' };
    return { grade: 'F', color: '#ef4444', label: 'Try again' };
  };

  const { grade, color, label } = getGrade(percentage);

  // Format time spent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Count correct/incorrect
  const correctCount = result.questionResults.filter((q) => q.isCorrect).length;
  const incorrectCount = result.questionResults.length - correctCount;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={`${styles.statusBadge} ${result.passed ? styles.passed : styles.failed}`}
        >
          {result.passed ? '✓ PASSED' : '✗ NOT PASSED'}
        </div>
        <h2 className={styles.title}>{quiz?.title || 'Quiz Results'}</h2>
      </div>

      {/* Score Circle */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreCircle} style={{ borderColor: color }}>
          <span className={styles.grade} style={{ color }}>
            {grade}
          </span>
          <span className={styles.percentage}>{percentage}%</span>
        </div>
        <div className={styles.scoreLabel}>{label}</div>
        <div className={styles.scoreDetails}>
          <span>{result.score} / {result.totalPoints} points</span>
          <span className={styles.separator}>•</span>
          <span>Passing: {passingScore}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue} style={{ color: '#10b981' }}>
            {correctCount}
          </div>
          <div className={styles.statLabel}>Correct</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>
            {incorrectCount}
          </div>
          <div className={styles.statLabel}>Incorrect</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{result.questionResults.length}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{formatTime(result.timeSpent)}</div>
          <div className={styles.statLabel}>Time</div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className={styles.breakdown}>
        <h3 className={styles.breakdownTitle}>Question Breakdown</h3>
        <div className={styles.questionList}>
          {result.questionResults.map((qr, index) => (
            <div
              key={qr.questionId}
              className={`${styles.questionItem} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
            >
              <div className={styles.questionNumber}>{index + 1}</div>
              <div className={styles.questionInfo}>
                <div className={styles.questionText}>{qr.questionText}</div>
                <div className={styles.questionMeta}>
                  <span className={qr.isCorrect ? styles.correctText : styles.incorrectText}>
                    {qr.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <span className={styles.separator}>•</span>
                  <span>
                    {qr.pointsEarned}/{qr.pointsPossible} pts
                  </span>
                </div>
                {!qr.isCorrect && quiz?.showResults && (
                  <div className={styles.feedback}>
                    <strong>Your answer:</strong>{' '}
                    {Array.isArray(qr.userAnswer)
                      ? qr.userAnswer.join(', ')
                      : qr.userAnswer || 'No answer'}
                    <br />
                    <strong>Correct answer:</strong>{' '}
                    {Array.isArray(qr.correctAnswer)
                      ? qr.correctAnswer.join(', ')
                      : qr.correctAnswer}
                    {qr.explanation && (
                      <>
                        <br />
                        <strong>Explanation:</strong> {qr.explanation}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {onViewDetails && (
          <button className={styles.secondaryButton} onClick={onViewDetails}>
            View Detailed Report
          </button>
        )}
        {!result.passed && allowRetry && onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            Try Again
          </button>
        )}
        {onContinue && (
          <button className={styles.primaryButton} onClick={onContinue}>
            {result.passed ? 'Continue to Next Lesson' : 'Back to Lesson'}
          </button>
        )}
      </div>
    </div>
  );
};
