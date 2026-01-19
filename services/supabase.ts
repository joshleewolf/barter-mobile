/**
 * Supabase Client Configuration
 *
 * This module initializes and exports the Supabase client for use throughout the app.
 * Uses AsyncStorage for persisting auth sessions in React Native.
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../constants/config';

// Database types (generated from Supabase schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          rating: number;
          total_trades: number;
          location: string | null;
          interests: string[];
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          rating?: number;
          total_trades?: number;
          location?: string | null;
          interests?: string[];
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          rating?: number;
          total_trades?: number;
          location?: string | null;
          interests?: string[];
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          images: string[];
          estimated_value: number;
          category: string;
          condition: string | null;
          type: 'ITEM' | 'SERVICE';
          location: string | null;
          status: 'ACTIVE' | 'TRADED' | 'DELETED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          images: string[];
          estimated_value: number;
          category: string;
          condition?: string | null;
          type: 'ITEM' | 'SERVICE';
          location?: string | null;
          status?: 'ACTIVE' | 'TRADED' | 'DELETED';
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          images?: string[];
          estimated_value?: number;
          category?: string;
          condition?: string | null;
          type?: 'ITEM' | 'SERVICE';
          location?: string | null;
          status?: 'ACTIVE' | 'TRADED' | 'DELETED';
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          from_user_id: string;
          to_user_id: string;
          offered_listing_id: string | null;
          cash_amount: number | null;
          message: string | null;
          status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          from_user_id: string;
          to_user_id: string;
          offered_listing_id?: string | null;
          cash_amount?: number | null;
          message?: string | null;
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
        };
        Update: {
          id?: string;
          listing_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          offered_listing_id?: string | null;
          cash_amount?: number | null;
          message?: string | null;
          status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          offer_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          offer_id?: string;
          sender_id?: string;
          content?: string;
          is_read?: boolean;
        };
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          direction: 'left' | 'right';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          direction: 'left' | 'right';
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          direction?: 'left' | 'right';
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper to get current session
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
