/* @Author - Ram-Ambati 
   @ This file describes what AuthState we are in and what to do
*/

import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

/*
This component {AuthProvider} Wraps the Whole app
Defines initial state loading 
*/
export function AuthProvider({ children }) {
  //useState sets the state of the authProvider component to 'loading' to indicate that the auth state is being initialized.
  const [authState, setAuthState] = useState({
    type: 'loading',
    user: null,
    guestId: null,
    limits: null,
    error: null,
  });

  // Initialize auth state on mount (with optimistic JWT decode + background verification)
  useEffect(() => {
    const initializeAuth = async () => {
      const session = await authService.checkSession();

      if (session.type === 'signed-in') {
        const limits = await authService.getLimits();
        setAuthState({
          type: 'signed-in',
          user: session.user,
          guestId: null,
          limits,
          error: null,
        });

        // If this was an optimistic JWT decode (no server call yet), verify with backend
        if (session.optimistic) {
          verifyInBackground();
        }
      } else if (session.type === 'guest') {
        const limits = await authService.getLimits();
        setAuthState({
          type: 'guest',
          user: null,
          guestId: session.guestId,
          limits,
          error: null,
        });
      } else {
        setAuthState({
          type: 'new',
          user: null,
          guestId: null,
          limits: null,
          error: null,
        });
      }
    };

    // Background verification: confirms GET /auth/me with the server
    const verifyInBackground = async () => {
      const verified = await authService.verifySessionWithRetry();

      if (verified === null) {
        return;
      }

      if (verified.type === 'signed-in') {
        const limits = await authService.getLimits();
        setAuthState(prev => ({
          ...prev,
          user: verified.user,
          limits,
        }));
      } else if (verified.type === 'invalid') {
        setAuthState({
          type: 'new',
          user: null,
          guestId: null,
          limits: null,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const startAsGuest = useCallback(async () => {
    const session = await authService.createGuestSession(); //calls createGuestSession from authservice.js via /session/guest.
    const limits = await authService.getLimits();
    authService.setWelcomeSeen();
    setAuthState({
      type: 'guest', // sets authstate to guest.
      user: null,
      guestId: session.guestId,
      limits,
      error: null,
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password); //calls login from authservice.js via /auth/login.
    if (result.success) {
      const limits = await authService.getLimits();
      authService.setWelcomeSeen();
      setAuthState({
        type: 'signed-in', //sets authstate to signed-in.
        user: result.user,
        guestId: null,
        limits,
        error: null,
      });
      return { success: true };
    } else {
      setAuthState((prev) => ({ ...prev, error: result.error }));
      return { success: false, error: result.error };
    }
  }, []);

  const register = useCallback(async (username, email, password, passwordConfirm) => {
    //calls register() from authservice.js via /auth/register.
    const result = await authService.register(username, email, password, passwordConfirm);
    if (result.success) {
      const limits = await authService.getLimits();
      authService.setWelcomeSeen();
      setAuthState({
        type: 'signed-in', //registered a new user so , signed in.
        user: result.user,
        guestId: null,
        limits,
        error: null,
      });
      return { success: true };
    } else {
      setAuthState((prev) => ({ ...prev, error: result.error }));
      return { success: false, error: result.error };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout(); //calls logout from authservice.js via /auth/logout.
    setAuthState({
      type: 'new', //and sets AuthState to new because no user nor guest exist.
      user: null,
      guestId: null,
      limits: null,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => { // cleanup function because we don't want old errors hanging around forever
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = { //exporting the state and functions to the rest of the app.
    ...authState,
    startAsGuest,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
