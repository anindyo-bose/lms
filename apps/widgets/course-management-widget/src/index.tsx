/**
 * Development entry point for Course Widget
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { CourseWidget } from './CourseWidget';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <CourseWidget
      isEducator={true}
      onCourseSelect={(course) => console.log('Selected:', course)}
    />
  </React.StrictMode>
);
