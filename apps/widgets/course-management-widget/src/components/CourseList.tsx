/**
 * CourseList Component - Displays course cards
 */

import React from 'react';
import styles from './CourseList.module.css';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  published: boolean;
}

interface CourseListProps {
  courses: Course[];
  onCourseSelect?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: string) => void;
  onEnroll?: (courseId: string) => void;
  isEducator?: boolean;
  loading?: boolean;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  onCourseSelect,
  onEdit,
  onDelete,
  onEnroll,
  isEducator = false,
  loading = false,
}) => {
  if (loading) {
    return <div className={styles.loading}>Loading courses...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No courses found</p>
        {isEducator && <p>Create your first course to get started!</p>}
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}`;
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'beginner':
        return styles.badgeBeginner;
      case 'intermediate':
        return styles.badgeIntermediate;
      case 'advanced':
        return styles.badgeAdvanced;
      default:
        return '';
    }
  };

  return (
    <div className={styles.grid}>
      {courses.map((course) => (
        <div
          key={course.id}
          className={styles.card}
          onClick={() => onCourseSelect?.(course)}
        >
          <div className={styles.imageWrapper}>
            <img src={course.imageUrl || '/placeholder.jpg'} alt={course.title} className={styles.image} />
            {!course.published && (
              <span className={styles.draftBadge}>Draft</span>
            )}
          </div>
          
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={`${styles.badge} ${getLevelBadgeClass(course.level)}`}>
                {course.level}
              </span>
              <span className={styles.category}>{course.category}</span>
            </div>
            
            <h3 className={styles.title}>{course.title}</h3>
            <p className={styles.description}>
              {course.description.length > 100
                ? `${course.description.substring(0, 100)}...`
                : course.description}
            </p>
            
            <div className={styles.footer}>
              <span className={styles.price}>{formatPrice(course.price)}</span>
              
              {isEducator ? (
                <div className={styles.actions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(course);
                    }}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(course.id);
                    }}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnroll?.(course.id);
                  }}
                  className={styles.enrollButton}
                >
                  Enroll
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
