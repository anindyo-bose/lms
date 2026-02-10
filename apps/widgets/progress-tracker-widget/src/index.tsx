/**
 * Progress Tracker Widget - Development Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProgressWidget } from './ProgressWidget';

// Development container
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <ProgressWidget
          onCourseClick={(courseId) => {
            console.log('Course clicked:', courseId);
          }}
          onRefresh={() => {
            console.log('Progress refreshed');
          }}
        />
      </div>
    </React.StrictMode>
  );
}

// Export for Module Federation
export { ProgressWidget } from './ProgressWidget';
export { ProgressDashboard } from './components/ProgressDashboard';
export { CourseSummary } from './components/CourseSummary';
