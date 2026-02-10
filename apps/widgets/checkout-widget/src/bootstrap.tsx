/**
 * Checkout Widget Bootstrap
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckoutWidget } from './CheckoutWidget';

// For standalone development
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);

  // Get course ID from URL params for dev mode
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId') || 'demo-course-123';

  root.render(
    <React.StrictMode>
      <CheckoutWidget
        courseId={courseId}
        onSuccess={(paymentIntentId) => {
          console.log('Payment successful:', paymentIntentId);
        }}
        onCancel={() => {
          console.log('Checkout cancelled');
          window.history.back();
        }}
        onError={(error) => {
          console.error('Checkout error:', error);
        }}
      />
    </React.StrictMode>
  );
}
