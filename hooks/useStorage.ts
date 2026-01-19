import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FAVORITES: 'barter_favorites',
  SELECTED_TRADE_ITEM: 'barter_selected_trade_item',
  FILTER_PREFERENCES: 'barter_filter_preferences',
  VIEW_MODE: 'barter_view_mode',
  THEME_PREFERENCE: 'barter_theme_preference',
} as const;

// Generic hook for persisting any JSON-serializable value
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Load from storage on mount
  useEffect(() => {
    loadValue();
  }, [key]);

  const loadValue = async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch (error) {
      console.error(`Failed to load ${key} from storage:`, error);
    }
  };

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolvedValue = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;

      // Persist to storage
      AsyncStorage.setItem(key, JSON.stringify(resolvedValue)).catch(error => {
        console.error(`Failed to save ${key} to storage:`, error);
      });

      return resolvedValue;
    });
  }, [key]);

  return [value, updateValue];
}

// Specialized hook for favorites (Set<string>)
export function useFavorites(): [Set<string>, (id: string) => void] {
  const [favoritesArray, setFavoritesArray] = usePersistedState<string[]>(
    STORAGE_KEYS.FAVORITES,
    []
  );

  const favorites = new Set(favoritesArray);

  const toggleFavorite = useCallback((id: string) => {
    setFavoritesArray(prev => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return Array.from(set);
    });
  }, [setFavoritesArray]);

  return [favorites, toggleFavorite];
}

// Hook for selected trade item
interface UserListing {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  status: string;
}

export function useSelectedTradeItem(): [
  UserListing | null,
  (item: UserListing | null) => void,
  boolean // isLoaded
] {
  const [item, setItem] = useState<UserListing | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const loadItem = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_TRADE_ITEM);
        if (stored !== null) {
          setItem(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load selected trade item:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadItem();
  }, []);

  const updateItem = useCallback((newItem: UserListing | null) => {
    setItem(newItem);
    AsyncStorage.setItem(
      STORAGE_KEYS.SELECTED_TRADE_ITEM,
      JSON.stringify(newItem)
    ).catch(error => {
      console.error('Failed to save selected trade item:', error);
    });
  }, []);

  return [item, updateItem, isLoaded];
}

// Hook for filter preferences
interface FilterPreferences {
  distance: string;
  category: string;
  minValue: number;
  maxValue: number;
  location: string;
}

const DEFAULT_FILTERS: FilterPreferences = {
  distance: '25 miles',
  category: 'All',
  minValue: 0,
  maxValue: 10000,
  location: 'Brooklyn, NY',
};

export function useFilterPreferences(): [
  FilterPreferences,
  (filters: Partial<FilterPreferences>) => void
] {
  const [filters, setFilters] = usePersistedState<FilterPreferences>(
    STORAGE_KEYS.FILTER_PREFERENCES,
    DEFAULT_FILTERS
  );

  const updateFilters = useCallback((updates: Partial<FilterPreferences>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, [setFilters]);

  return [filters, updateFilters];
}

// Hook for view mode preference
export function useViewModePreference(): [
  'swipe' | 'grid' | 'map',
  (mode: 'swipe' | 'grid' | 'map') => void
] {
  const [mode, setMode] = usePersistedState<'swipe' | 'grid' | 'map'>(
    STORAGE_KEYS.VIEW_MODE,
    'swipe'
  );

  return [mode, setMode];
}

// Export storage keys for direct access if needed
export { STORAGE_KEYS };
