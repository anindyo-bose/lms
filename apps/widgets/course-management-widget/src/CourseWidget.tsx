/**
 * CourseWidget - Main Component
 * Exposes ICourseWidget contract for shell integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CourseList } from './components/CourseList';
import { CourseForm } from './components/CourseForm';
import { useCourse } from './hooks/useCourse';
import styles from './CourseWidget.module.css';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface Course {
  id: string;
  educatorId: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseWidgetProps {
  isEducator?: boolean;
  onCourseSelect?: (course: Course) => void;
  onEnroll?: (courseId: string) => void;
}

export const CourseWidget: React.FC<CourseWidgetProps> = ({
  isEducator = false,
  onCourseSelect,
  onEnroll,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const {
    courses,
    selectedCourse,
    loading,
    error,
    fetchCourses,
    fetchMyCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    setSelectedCourse,
    clearError,
  } = useCourse();

  // Fetch courses on mount
  useEffect(() => {
    if (isEducator) {
      fetchMyCourses();
    } else {
      fetchCourses();
    }
  }, [isEducator, fetchCourses, fetchMyCourses]);

  const handleCourseSelect = useCallback(
    (course: Course) => {
      setSelectedCourse(course);
      onCourseSelect?.(course);
    },
    [setSelectedCourse, onCourseSelect]
  );

  const handleCreate = async (data: any) => {
    const result = await createCourse(data);
    if (result?.success) {
      setViewMode('list');
    }
    return result || { success: false };
  };

  const handleUpdate = async (data: any) => {
    if (!selectedCourse) return { success: false };
    const result = await updateCourse(selectedCourse.id, data);
    if (result?.success) {
      setViewMode('list');
    }
    return result || { success: false };
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      await deleteCourse(courseId);
    }
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setViewMode('edit');
  };

  const handleEnroll = async (courseId: string) => {
    const result = await enrollInCourse(courseId);
    if (result?.success) {
      onEnroll?.(courseId);
    }
  };

  // Render based on view mode
  if (viewMode === 'create') {
    return (
      <CourseForm
        onSubmit={handleCreate}
        onCancel={() => setViewMode('list')}
        loading={loading}
      />
    );
  }

  if (viewMode === 'edit' && selectedCourse) {
    return (
      <CourseForm
        course={selectedCourse}
        onSubmit={handleUpdate}
        onCancel={() => {
          setViewMode('list');
          setSelectedCourse(null);
        }}
        loading={loading}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEducator ? 'My Courses' : 'Browse Courses'}</h1>
        {isEducator && (
          <button onClick={() => setViewMode('create')} className={styles.createButton}>
            + Create Course
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={clearError} className={styles.dismissButton}>
            Dismiss
          </button>
        </div>
      )}

      <CourseList
        courses={courses}
        onCourseSelect={handleCourseSelect}
        onEdit={isEducator ? handleEdit : undefined}
        onDelete={isEducator ? handleDelete : undefined}
        onEnroll={!isEducator ? handleEnroll : undefined}
        isEducator={isEducator}
        loading={loading}
      />
    </div>
  );
};

CourseWidget.displayName = 'CourseWidget';
