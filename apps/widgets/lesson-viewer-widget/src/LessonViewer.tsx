/**
 * LessonViewer Component - Main lesson content viewer widget
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useLesson } from './hooks/useLesson';
import { LessonList } from './components/LessonList';
import styles from './LessonViewer.module.css';

interface LessonViewerProps {
  courseId: string;
  initialLessonId?: string;
  userId?: string;
  onLessonComplete?: (lessonId: string) => void;
  onCourseComplete?: (courseId: string) => void;
}

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

export const LessonViewer: React.FC<LessonViewerProps> = ({
  courseId,
  initialLessonId,
  userId,
  onLessonComplete,
  onCourseComplete,
}) => {
  const {
    lessons,
    currentLesson,
    progress,
    courseProgress,
    loading,
    error,
    fetchLessons,
    getLesson,
    getProgress,
    updateProgress,
    markComplete,
    getCourseProgress,
  } = useLesson();

  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(initialLessonId);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  // Fetch lessons on mount
  useEffect(() => {
    if (courseId) {
      fetchLessons(courseId);
      getCourseProgress(courseId);
    }
  }, [courseId, fetchLessons, getCourseProgress]);

  // Load initial or first lesson
  useEffect(() => {
    if (!selectedLessonId && lessons.length > 0) {
      const firstLesson = lessons[0];
      setSelectedLessonId(firstLesson.id);
      getLesson(firstLesson.id);
      getProgress(firstLesson.id);
    } else if (selectedLessonId) {
      getLesson(selectedLessonId);
      getProgress(selectedLessonId);
    }
  }, [selectedLessonId, lessons, getLesson, getProgress]);

  // Handle lesson selection
  const handleLessonSelect = useCallback(
    (lesson: Lesson) => {
      setSelectedLessonId(lesson.id);
      setVideoProgress(0);
    },
    []
  );

  // Handle video progress update
  const handleVideoProgress = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      const percentage = Math.round((video.currentTime / video.duration) * 100);
      setVideoProgress(percentage);

      // Update progress periodically (every 10%)
      if (selectedLessonId && percentage % 10 === 0 && percentage > 0) {
        updateProgress(selectedLessonId, {
          completionPercentage: percentage,
          timeSpentSeconds: Math.round(video.currentTime),
        });
      }
    },
    [selectedLessonId, updateProgress]
  );

  // Handle mark complete
  const handleMarkComplete = useCallback(async () => {
    if (!selectedLessonId) return;

    setIsMarkingComplete(true);
    try {
      await markComplete(selectedLessonId);
      onLessonComplete?.(selectedLessonId);

      // Refresh course progress
      await getCourseProgress(courseId);

      // Check if course is complete
      if (courseProgress && courseProgress.lessonsCompleted + 1 >= courseProgress.totalLessons) {
        onCourseComplete?.(courseId);
      }
    } finally {
      setIsMarkingComplete(false);
    }
  }, [selectedLessonId, markComplete, onLessonComplete, getCourseProgress, courseId, courseProgress, onCourseComplete]);

  // Navigate to next lesson
  const handleNextLesson = useCallback(() => {
    if (!currentLesson || lessons.length === 0) return;

    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      setSelectedLessonId(nextLesson.id);
    }
  }, [currentLesson, lessons]);

  // Navigate to previous lesson
  const handlePrevLesson = useCallback(() => {
    if (!currentLesson || lessons.length === 0) return;

    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex > 0) {
      const prevLesson = lessons[currentIndex - 1];
      setSelectedLessonId(prevLesson.id);
    }
  }, [currentLesson, lessons]);

  // Build progress map for LessonList
  const progressMap = lessons.reduce(
    (acc, lesson) => {
      if (progress[lesson.id]) {
        acc[lesson.id] = {
          completionPercentage: progress[lesson.id].completionPercentage,
          completedAt: progress[lesson.id].completedAt,
        };
      }
      return acc;
    },
    {} as Record<string, { completionPercentage: number; completedAt?: Date }>
  );

  const currentIndex = currentLesson
    ? lessons.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const isLessonComplete = currentLesson && progress[currentLesson.id]?.completionPercentage >= 100;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Lessons</h3>
          <p>{error}</p>
          <button onClick={() => fetchLessons(courseId)} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <LessonList
          lessons={lessons}
          currentLessonId={selectedLessonId}
          progress={progressMap}
          onLessonSelect={handleLessonSelect}
          loading={loading && lessons.length === 0}
        />

        {courseProgress && (
          <div className={styles.courseProgress}>
            <div className={styles.progressLabel}>
              Course Progress: {courseProgress.lessonsCompleted}/{courseProgress.totalLessons} lessons
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${courseProgress.averageCompletion}%` }}
              />
            </div>
            <div className={styles.progressPercent}>
              {Math.round(courseProgress.averageCompletion)}% complete
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {loading && !currentLesson ? (
          <div className={styles.loading}>Loading lesson...</div>
        ) : currentLesson ? (
          <>
            {/* Lesson Header */}
            <header className={styles.header}>
              <div className={styles.lessonNumber}>
                Lesson {currentIndex + 1} of {lessons.length}
              </div>
              <h1 className={styles.title}>{currentLesson.title}</h1>
              <p className={styles.description}>{currentLesson.description}</p>
            </header>

            {/* Video Player */}
            {currentLesson.videoUrl && (
              <div className={styles.videoContainer}>
                <video
                  key={currentLesson.id}
                  className={styles.video}
                  src={currentLesson.videoUrl}
                  controls
                  onTimeUpdate={handleVideoProgress}
                  onEnded={() => {
                    if (selectedLessonId) {
                      updateProgress(selectedLessonId, { completionPercentage: 100 });
                    }
                  }}
                />
                <div className={styles.videoProgress}>
                  <div className={styles.videoProgressBar}>
                    <div
                      className={styles.videoProgressFill}
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <span>{videoProgress}% watched</span>
                </div>
              </div>
            )}

            {/* Lesson Content */}
            <article className={styles.content}>
              <div
                className={styles.contentBody}
                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
              />
            </article>

            {/* Actions */}
            <footer className={styles.footer}>
              <div className={styles.navigation}>
                <button
                  className={styles.navButton}
                  onClick={handlePrevLesson}
                  disabled={currentIndex <= 0}
                >
                  ← Previous
                </button>

                <button
                  className={`${styles.completeButton} ${isLessonComplete ? styles.completed : ''}`}
                  onClick={handleMarkComplete}
                  disabled={isLessonComplete || isMarkingComplete}
                >
                  {isMarkingComplete
                    ? 'Marking...'
                    : isLessonComplete
                    ? '✓ Completed'
                    : 'Mark as Complete'}
                </button>

                <button
                  className={styles.navButton}
                  onClick={handleNextLesson}
                  disabled={currentIndex >= lessons.length - 1}
                >
                  Next →
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className={styles.empty}>
            <h3>No Lesson Selected</h3>
            <p>Select a lesson from the sidebar to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonViewer;
