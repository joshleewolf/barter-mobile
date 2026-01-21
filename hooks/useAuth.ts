import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, type Database } from '../services/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { clearUserStorage } from './useStorage';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  bio?: string;
  location?: string;
  phone?: string;
  rating?: number;
  totalTrades?: number;
  interests?: string[];
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Transform Supabase user + profile to our User type
async function fetchUserProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single<Profile>();

  if (error || !profile) {
    console.error('Failed to fetch profile:', error);
    return null;
  }

  return {
    id: profile.id,
    email: supabaseUser.email || '',
    username: profile.username,
    displayName: profile.display_name,
    avatar: profile.avatar_url,
    bio: profile.bio || undefined,
    location: profile.location || undefined,
    rating: profile.rating ? Number(profile.rating) : undefined,
    totalTrades: profile.total_trades ?? undefined,
    interests: profile.interests || [],
    onboardingCompleted: profile.onboarding_completed || false,
  };
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Optionally refresh user profile on token refresh
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message);
      }

      console.log('Login successful, user:', data.user?.id);

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user);
        console.log('Profile fetched:', userProfile);
        if (!userProfile) {
          // Profile doesn't exist yet, create a basic one
          console.log('No profile found, user can still proceed');
        }
        setUser(userProfile);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => {
    setIsLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            display_name: data.displayName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // The profile will be created automatically by the database trigger
      // Wait a moment for the trigger to complete, then fetch the profile
      if (authData.user) {
        // Small delay to allow trigger to execute
        await new Promise(resolve => setTimeout(resolve, 500));

        const userProfile = await fetchUserProfile(authData.user);
        setUser(userProfile);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear user-related storage (selected trade item, favorites, etc.)
      await clearUserStorage();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (supabaseUser) {
      const userProfile = await fetchUserProfile(supabaseUser);
      setUser(userProfile);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    logout,
    refreshUser,
  };
}
