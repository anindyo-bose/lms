/**
 * CourseSummary Component - Single course progress view
 */

import React from 'react';
import type { CourseProgressDetail } from '../types';
import styles from './CourseSummary.module.css';

interface CourseSummaryProps {
  course: CourseProgressDetail;
  onContinue?: () => void;
  onViewAll?: () => void;
}

export const CourseSummary: React.FC<CourseSummaryProps> = ({
  course,
  onContinue,
  onViewAll,
}) => {
  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isComplete = course.completionPercentage >= 100;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {course.courseImage && (
          <img
            src={course.courseImage}
            alt={course.courseTitle}
            className={styles.image}
          />
        )}
        <div className={styles.headerContent}>
          <h3 className={styles.title}>{course.courseTitle}</h3>
          <div className={styles.enrolledDate}>
            Enrolled {formatDate(course.enrolledAt)}
          </div>
        </div>
        {isComplete && <div className={styles.completeBadge}>✓ Complete</div>}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          <span>Progress</span>
          <span className={styles.progressPercent}>
            {Math.round(course.completionPercentage)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${isComplete ? styles.complete : ''}`}
            style={{ width: `${course.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {course.lessonsCompleted}/{course.totalLessons}
          </div>
          <div className={styles.statLabel}>Lessons</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {course.quizzesPassed}/{course.totalQuizzes}
          </div>
          <div className={styles.statLabel}>Quizzes Passed</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{formatTime(course.timeSpent)}</div>
          <div className={styles.statLabel}>Time Spent</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {formatDate(course.lastAccessedAt)}
          </div>
          <div className={styles.statLabel}>Last Accessed</div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {onViewAll && (
          <button onClick={onViewAll} className={styles.secondaryButton}>
            View All Progress
          </button>
        )}
        {onContinue && !isComplete && (
          <button onClick={onContinue} className={styles.primaryButton}>
            Continue Learning
          </button>
        )}
        {isComplete && course.completedAt && (
          <div className={styles.completedInfo}>
            Completed on {formatDate(course.completedAt)}
          </div>
        )}
      </div>
    </div>
  );
};
