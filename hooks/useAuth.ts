import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USER } from '../services/mockData';

// Enable mock mode for UI testing without backend
const USE_MOCK = true;

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  rating?: number;
  totalTrades?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    // Small delay to show splash screen
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const login = useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setUser(MOCK_USER as User);
      return;
    }
    // Real API call would go here
  }, []);

  const register = useCallback(async (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setUser({
        ...MOCK_USER,
        email: data.email,
        username: data.username,
        displayName: data.displayName,
      } as User);
      return;
    }
    // Real API call would go here
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (USE_MOCK && user) {
      setUser(MOCK_USER as User);
    }
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };
}
