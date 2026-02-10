/**
 * Signup Page - Uses Auth Widget
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamic import for the Auth Widget (Module Federation)
const AuthWidget = dynamic(() => import('authWidget/AuthWidget').then((mod) => mod.AuthWidget), {
  loading: () => <div>Loading auth...</div>,
  ssr: false,
});

export default function SignupPage() {
  const router = useRouter();
  const [authWidgetReady, setAuthWidgetReady] = useState(false);

  useEffect(() => {
    setAuthWidgetReady(true);
  }, []);

  const handleAuthSuccess = () => {
    // Redirect to dashboard after successful signup
    router.push('/dashboard');
  };

  if (!authWidgetReady) {
    return <div>Loading...</div>;
  }

  return <AuthWidget initialMode="signup" onAuthStateChange={handleAuthSuccess} />;
}
