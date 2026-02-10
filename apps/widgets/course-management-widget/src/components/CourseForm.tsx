/**
 * CourseForm Component - Create/Edit course form
 */

import React, { useState, useEffect } from 'react';
import styles from './CourseForm.module.css';

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

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (data: Omit<Course, 'id' | 'published'>) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

const CATEGORIES = [
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Data Science',
  'Languages',
  'Health & Fitness',
  'Music',
  'Photography',
  'Other',
];

export const CourseForm: React.FC<CourseFormProps> = ({ course, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    price: 0,
    category: CATEGORIES[0],
    level: 'beginner' as const,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        category: course.category,
        level: course.level,
      });
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.imageUrl.trim()) {
      setError('Image URL is required');
      return;
    }

    if (formData.price < 0) {
      setError('Price cannot be negative');
      return;
    }

    const result = await onSubmit(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    // Convert dollars to cents for storage
    setFormData((prev) => ({ ...prev, price: Math.round(value * 100) }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>{course ? 'Edit Course' : 'Create New Course'}</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Course Title
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Introduction to Web Development"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what students will learn..."
              className={styles.textarea}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="imageUrl" className={styles.label}>
              Cover Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className={styles.input}
              disabled={loading}
            />
            {formData.imageUrl && (
              <div className={styles.imagePreview}>
                <img src={formData.imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category" className={styles.label}>
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className={styles.select}
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="level" className={styles.label}>
                Level
              </label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                  }))
                }
                className={styles.select}
                disabled={loading}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Price (USD)
            </label>
            <div className={styles.priceInput}>
              <span className={styles.priceCurrency}>$</span>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={(formData.price / 100).toFixed(2)}
                onChange={handlePriceChange}
                className={styles.input}
                disabled={loading}
              />
            </div>
            <p className={styles.hint}>Set to 0 for a free course</p>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
