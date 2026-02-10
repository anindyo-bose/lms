/**
 * ProgressWidget Component - Main progress tracker widget
 */

import React, { useEffect } from 'react';
import { useProgress } from './hooks/useProgress';
import { ProgressDashboard } from './components/ProgressDashboard';
import styles from './ProgressWidget.module.css';

interface ProgressWidgetProps {
  onCourseClick?: (courseId: string) => void;
  onRefresh?: () => void;
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  onCourseClick,
  onRefresh,
}) => {
  const {
    progress,
    activities,
    weeklyStats,
    loading,
    error,
    fetchProgress,
    fetchActivities,
    fetchWeeklyStats,
    refresh,
  } = useProgress();

  // Load data on mount
  useEffect(() => {
    fetchProgress();
    fetchActivities(10);
    fetchWeeklyStats(8);
  }, [fetchProgress, fetchActivities, fetchWeeklyStats]);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    onRefresh?.();
  };

  // Loading state
  if (loading && !progress) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading your progress...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !progress) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Progress</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!progress) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3>No Progress Yet</h3>
          <p>Start your learning journey by enrolling in a course!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Your Learning Progress</h2>
        <button
          onClick={handleRefresh}
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </header>

      <ProgressDashboard
        progress={progress}
        activities={activities}
        weeklyStats={weeklyStats}
        onCourseClick={onCourseClick}
      />
    </div>
  );
};

export default ProgressWidget;
