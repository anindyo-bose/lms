/**
 * Development entry point for Auth Widget
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthWidget } from './AuthWidget';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <AuthWidget
      initialMode="login"
      onAuthStateChange={(state) => {
        console.log('Auth state changed:', state);
      }}
    />
  </React.StrictMode>
);
