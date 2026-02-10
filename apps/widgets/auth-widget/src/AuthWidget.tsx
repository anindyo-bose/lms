/**
 * AuthWidget - Main Component
 * Exposes IAuthWidget contract for shell integration
 */

import React, { useState, useCallback, useRef } from 'react';
import { IAuthWidget } from '@composey/shared-types';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { useAuth } from './hooks/useAuth';

type AuthMode = 'login' | 'signup';

interface AuthWidgetProps {
  initialMode?: AuthMode;
  onAuthStateChange?: (state: IAuthWidget.AuthState) => void;
}

/**
 * AuthWidget Component
 * Manages authentication UI and exposes contract methods
 */
export const AuthWidget = React.forwardRef<IAuthWidget.AuthWidgetInterface, AuthWidgetProps>(
  ({ initialMode = 'login', onAuthStateChange }, ref) => {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const { isAuthenticated, user, login, signup, logout, getCurrentUser } = useAuth();
    const authStateCallbackRef = useRef(onAuthStateChange);

    // Update callback ref when prop changes
    React.useEffect(() => {
      authStateCallbackRef.current = onAuthStateChange;
    }, [onAuthStateChange]);

    // Emit auth state changes
    React.useEffect(() => {
      if (authStateCallbackRef.current) {
        authStateCallbackRef.current({
          isAuthenticated,
          user: user || undefined,
        });
      }
    }, [isAuthenticated, user]);

    // Expose interface via ref
    React.useImperativeHandle(ref, () => ({
      getCurrentUser,
      login,
      signup,
      logout,
      isAuthenticated,
      user,
      setMode,
    }));

    // Render based on authentication state and mode
    if (isAuthenticated && user) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Welcome, {user.firstName}!</h2>
          <p>{user.email}</p>
          <p>Role: {user.role}</p>
          {user.mustChangePassword && (
            <p style={{ color: 'red' }}>You must change your password before continuing</p>
          )}
          <button onClick={logout}>Logout</button>
        </div>
      );
    }

    return (
      <>
        {mode === 'login' ? (
          <LoginForm onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setMode('login')} />
        )}
      </>
    );
  }
);

AuthWidget.displayName = 'AuthWidget';
