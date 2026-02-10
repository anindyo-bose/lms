/**
 * Quiz Engine Widget - Development Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QuizWidget } from './QuizWidget';

// Development container
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  // Get quiz/lesson ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('quizId') || undefined;
  const lessonId = urlParams.get('lessonId') || 'demo-lesson';

  root.render(
    <React.StrictMode>
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <QuizWidget
          quizId={quizId}
          lessonId={lessonId}
          onComplete={(result) => {
            console.log('Quiz completed:', result);
          }}
          onClose={() => {
            console.log('Quiz closed');
          }}
        />
      </div>
    </React.StrictMode>
  );
}

// Export for Module Federation
export { QuizWidget } from './QuizWidget';
export { QuizPlayer } from './components/QuizPlayer';
export { QuizResults } from './components/QuizResults';
