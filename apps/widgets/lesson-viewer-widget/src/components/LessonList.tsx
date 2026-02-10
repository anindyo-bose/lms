/**
 * LessonList Component - Course lesson navigation
 */

import React from 'react';
import styles from './LessonList.module.css';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  published: boolean;
}

interface LessonProgress {
  [lessonId: string]: {
    completionPercentage: number;
    completedAt?: Date;
  };
}

interface LessonListProps {
  lessons: Lesson[];
  currentLessonId?: string;
  progress?: LessonProgress;
  onLessonSelect: (lesson: Lesson) => void;
  loading?: boolean;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  currentLessonId,
  progress = {},
  onLessonSelect,
  loading = false,
}) => {
  if (loading) {
    return <div className={styles.loading}>Loading lessons...</div>;
  }

  if (lessons.length === 0) {
    return <div className={styles.empty}>No lessons available</div>;
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getProgressStatus = (lessonId: string) => {
    const lessonProgress = progress[lessonId];
    if (!lessonProgress) return 'not-started';
    if (lessonProgress.completionPercentage >= 100) return 'completed';
    if (lessonProgress.completionPercentage > 0) return 'in-progress';
    return 'not-started';
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.header}>Course Content</h3>
      <ul className={styles.list}>
        {lessons.map((lesson, index) => {
          const status = getProgressStatus(lesson.id);
          const isCurrent = lesson.id === currentLessonId;

          return (
            <li
              key={lesson.id}
              className={`${styles.item} ${isCurrent ? styles.current : ''} ${styles[status]}`}
              onClick={() => onLessonSelect(lesson)}
            >
              <div className={styles.number}>{index + 1}</div>
              <div className={styles.content}>
                <h4 className={styles.title}>{lesson.title}</h4>
                <div className={styles.meta}>
                  <span className={styles.duration}>{formatDuration(lesson.duration)}</span>
                  {status === 'completed' && (
                    <span className={styles.completedBadge}>✓ Completed</span>
                  )}
                  {status === 'in-progress' && (
                    <span className={styles.progressBadge}>
                      {progress[lesson.id]?.completionPercentage}%
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.statusIcon}>
                {status === 'completed' && '✓'}
                {status === 'in-progress' && '◐'}
                {status === 'not-started' && '○'}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
