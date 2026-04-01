import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen for auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (data: SignUpData): Promise<{ error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName || '',
          },
        },
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return {};
    } catch (err) {
      const error = 'שגיאה בהרשמה';
      setState(prev => ({ ...prev, loading: false, error }));
      return { error };
    }
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (data: SignInData): Promise<{ error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return {};
    } catch (err) {
      const error = 'שגיאה בהתחברות';
      setState(prev => ({ ...prev, loading: false, error }));
      return { error };
    }
  }, []);

  // Sign in anonymously (guest mode)
  const signInAnonymously = useCallback(async (): Promise<{ error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return {};
    } catch (err) {
      const error = 'שגיאה בהתחברות אנונימית';
      setState(prev => ({ ...prev, loading: false, error }));
      return { error };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err) {
      return { error: 'שגיאה בשליחת אימייל איפוס' };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: { fullName?: string; avatarUrl?: string }): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err) {
      return { error: 'שגיאה בעדכון פרופיל' };
    }
  }, []);

  // Get user storage path (for organizing files per user)
  const getUserStoragePath = useCallback((): string => {
    if (!state.user) return 'anonymous';
    return state.user.id;
  }, [state.user]);

  // Check if user is anonymous
  const isAnonymous = useCallback((): boolean => {
    return state.user?.is_anonymous === true;
  }, [state.user]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signInAnonymously,
    signOut,
    resetPassword,
    updateProfile,
    getUserStoragePath,
    isAnonymous,
    isAuthenticated: !!state.user && !state.user.is_anonymous,
  };
}
