import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isSuperUser: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateCredentials = (email: string, password: string): void => {
    if (!email?.trim()) {
      throw new Error('Email is required');
    }
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  };

  const handleAuthError = (error: AuthError | Error | unknown): string => {
    if (!error) {
      return 'An unexpected error occurred';
    }

    // Handle AuthApiError specifically
    if (error && (error as AuthError).__isAuthError) {
      const authError = error as AuthError;
      if (authError.status === 400) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';
    
    if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('already registered')) {
      return 'This email is already registered. Please log in instead.';
    }
    if (message.includes('password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('email')) {
      return 'Please enter a valid email address.';
    }
    
    return error instanceof Error ? error.message : 'An unexpected error occurred';
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      validateCredentials(email, password);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data received');
      }
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      validateCredentials(email, password);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data received');
      }
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      const errorMessage = handleAuthError(error);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isSuperUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}