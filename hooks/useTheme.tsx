import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Secondary
  secondary: string;
  secondaryDark: string;

  // Backgrounds
  background: string;
  backgroundLight: string;
  surface: string;
  surfaceLight: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI Elements
  border: string;
  cardBg: string;
  overlay: string;

  // Swipe indicators
  swipeRight: string;
  swipeLeft: string;
  tradeBlue: string;

  // White/Black
  white: string;
  black: string;

  // Glass effect
  glass: string;
  glassBorder: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const darkColors: ThemeColors = {
  // Primary - Vibrant green
  primary: '#19E680',
  primaryDark: '#10B981',
  primaryLight: '#34D399',

  // Secondary - Trade blue
  secondary: '#3B82F6',
  secondaryDark: '#2563EB',

  // Backgrounds - Dark forest theme
  background: '#0A0A0A',
  backgroundLight: '#1A1A1A',
  surface: 'rgba(255, 255, 255, 0.1)',
  surfaceLight: 'rgba(255, 255, 255, 0.15)',

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textInverse: '#0A0A0A',

  // Semantic
  success: '#19E680',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI Elements
  border: 'rgba(255, 255, 255, 0.1)',
  cardBg: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Swipe indicators
  swipeRight: '#19E680',
  swipeLeft: '#EF4444',
  tradeBlue: '#3B82F6',

  // White/Black
  white: '#FFFFFF',
  black: '#000000',

  // Glass effect
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Tab bar
  tabBar: '#0A0A0A',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
};

const lightColors: ThemeColors = {
  // Primary - Vibrant green
  primary: '#19E680',
  primaryDark: '#10B981',
  primaryLight: '#34D399',

  // Secondary - Trade blue
  secondary: '#3B82F6',
  secondaryDark: '#2563EB',

  // Backgrounds - Light theme
  background: '#F8F9FA',
  backgroundLight: '#FFFFFF',
  surface: 'rgba(0, 0, 0, 0.05)',
  surfaceLight: 'rgba(0, 0, 0, 0.08)',

  // Text
  text: '#1A1A1A',
  textSecondary: 'rgba(0, 0, 0, 0.7)',
  textMuted: 'rgba(0, 0, 0, 0.5)',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI Elements
  border: 'rgba(0, 0, 0, 0.1)',
  cardBg: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Swipe indicators
  swipeRight: '#10B981',
  swipeLeft: '#EF4444',
  tradeBlue: '#3B82F6',

  // White/Black
  white: '#FFFFFF',
  black: '#000000',

  // Glass effect
  glass: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0, 0, 0, 0.1)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@barter_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setMode(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    saveTheme(newMode);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    saveTheme(newMode);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors,
        toggleTheme,
        setTheme,
        isDark: mode === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for static usage where hooks can't be used
export { darkColors, lightColors };
