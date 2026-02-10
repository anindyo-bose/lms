/**
 * Lesson Viewer Widget - Development Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { LessonViewer } from './LessonViewer';

// Development container
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  // Mock course ID for development
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId') || 'demo-course';
  const lessonId = urlParams.get('lessonId') || undefined;

  root.render(
    <React.StrictMode>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <LessonViewer
          courseId={courseId}
          initialLessonId={lessonId}
          onLessonComplete={(id) => console.log('Lesson completed:', id)}
          onCourseComplete={(id) => console.log('Course completed:', id)}
        />
      </div>
    </React.StrictMode>
  );
}

// Export for Module Federation
export { LessonViewer } from './LessonViewer';
export { LessonList } from './components/LessonList';
