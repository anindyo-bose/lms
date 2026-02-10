/**
 * ProgressDashboard Component - Learning analytics dashboard
 */

import React from 'react';
import type { LearningProgress, LearningActivity, WeeklyStats } from '../types';
import styles from './ProgressDashboard.module.css';

interface ProgressDashboardProps {
  progress: LearningProgress;
  activities?: LearningActivity[];
  weeklyStats?: WeeklyStats[];
  onCourseClick?: (courseId: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  activities = [],
  weeklyStats = [],
  onCourseClick,
}) => {
  // Format time (seconds to readable format)
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get activity icon
  const getActivityIcon = (type: LearningActivity['type']) => {
    switch (type) {
      case 'lesson_complete':
        return '📚';
      case 'quiz_passed':
        return '✅';
      case 'course_enrolled':
        return '🎯';
      case 'course_complete':
        return '🎓';
      case 'streak_milestone':
        return '🔥';
      default:
        return '📌';
    }
  };

  // Calculate max for chart scaling
  const maxWeeklyStat = Math.max(
    ...weeklyStats.map((w) => Math.max(w.lessonsCompleted, w.quizzesPassed)),
    1
  );

  return (
    <div className={styles.container}>
      {/* Stats Overview */}
      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{Math.round(progress.overallCompletion)}%</div>
            <div className={styles.statLabel}>Overall Progress</div>
          </div>
          <div className={styles.progressRing}>
            <svg viewBox="0 0 36 36" className={styles.ring}>
              <path
                className={styles.ringBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.ringFill}
                strokeDasharray={`${progress.overallCompletion}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎓</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {progress.coursesCompleted}/{progress.totalCoursesEnrolled}
            </div>
            <div className={styles.statLabel}>Courses Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatTime(progress.totalTimeSpent)}</div>
            <div className={styles.statLabel}>Total Learning Time</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{progress.currentStreak}</div>
            <div className={styles.statLabel}>Day Streak</div>
          </div>
          {progress.longestStreak > progress.currentStreak && (
            <div className={styles.statMeta}>Best: {progress.longestStreak}</div>
          )}
        </div>
      </section>

      {/* Courses In Progress */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Courses In Progress</h3>
        <div className={styles.courseList}>
          {progress.courseProgress
            .filter((c) => !c.completedAt)
            .slice(0, 4)
            .map((course) => (
              <div
                key={course.courseId}
                className={styles.courseCard}
                onClick={() => onCourseClick?.(course.courseId)}
              >
                {course.courseImage && (
                  <img
                    src={course.courseImage}
                    alt={course.courseTitle}
                    className={styles.courseImage}
                  />
                )}
                <div className={styles.courseInfo}>
                  <h4 className={styles.courseTitle}>{course.courseTitle}</h4>
                  <div className={styles.courseMeta}>
                    <span>
                      {course.lessonsCompleted}/{course.totalLessons} lessons
                    </span>
                    <span className={styles.separator}>•</span>
                    <span>{formatTime(course.timeSpent)}</span>
                  </div>
                  <div className={styles.courseProgress}>
                    <div
                      className={styles.courseProgressFill}
                      style={{ width: `${course.completionPercentage}%` }}
                    />
                  </div>
                  <div className={styles.progressPercent}>
                    {Math.round(course.completionPercentage)}% complete
                  </div>
                </div>
              </div>
            ))}

          {progress.courseProgress.filter((c) => !c.completedAt).length === 0 && (
            <div className={styles.emptyState}>
              No courses in progress. Start learning today!
            </div>
          )}
        </div>
      </section>

      {/* Weekly Activity Chart */}
      {weeklyStats.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Weekly Activity</h3>
          <div className={styles.chart}>
            {weeklyStats.map((week, index) => (
              <div key={week.week} className={styles.chartBar}>
                <div className={styles.barContainer}>
                  <div
                    className={styles.barLesson}
                    style={{
                      height: `${(week.lessonsCompleted / maxWeeklyStat) * 100}%`,
                    }}
                    title={`${week.lessonsCompleted} lessons`}
                  />
                  <div
                    className={styles.barQuiz}
                    style={{
                      height: `${(week.quizzesPassed / maxWeeklyStat) * 100}%`,
                    }}
                    title={`${week.quizzesPassed} quizzes`}
                  />
                </div>
                <div className={styles.barLabel}>W{index + 1}</div>
              </div>
            ))}
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
              Lessons
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#10b981' }} />
              Quizzes
            </span>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {activities.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <div className={styles.activityList}>
            {activities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>{getActivityIcon(activity.type)}</div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>{activity.title}</div>
                  <div className={styles.activityDescription}>{activity.description}</div>
                </div>
                <div className={styles.activityTime}>
                  {formatRelativeTime(activity.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {progress.achievements.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Achievements</h3>
          <div className={styles.achievementGrid}>
            {progress.achievements.map((achievement) => (
              <div key={achievement.id} className={styles.achievementCard}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementTitle}>{achievement.title}</div>
                <div className={styles.achievementDescription}>
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
