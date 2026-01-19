import { ExpoConfig, ConfigContext } from 'expo/config';

// Supabase configuration
const SUPABASE_URL = 'https://zycjweqawglcddmfyvvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Y2p3ZXFhd2dsY2RkbWZ5dnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTMzNzMsImV4cCI6MjA4NDE2OTM3M30.YMRzh8udxuTm5aZq5oUkahmWg1TsLcEnk2YKMMsZ108';

// Environment configuration
const ENV = {
  development: {
    apiUrl: 'http://localhost:3001/api/v1',
    environment: 'development',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
  staging: {
    apiUrl: 'https://staging-api.barter.app/api/v1',
    environment: 'staging',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
  production: {
    apiUrl: 'https://api.barter.app/api/v1',
    environment: 'production',
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
};

// Determine which environment to use based on APP_ENV or EAS build profile
const getEnvConfig = () => {
  const appEnv = process.env.APP_ENV as keyof typeof ENV;
  if (appEnv && ENV[appEnv]) {
    return ENV[appEnv];
  }
  // Default to development
  return ENV.development;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const envConfig = getEnvConfig();

  return {
    ...config,
    name: 'Barter',
    slug: 'barter',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0A0A',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.barter.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0A',
      },
      edgeToEdgeEnabled: true,
      package: 'app.barter.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'barter',
    extra: {
      apiUrl: envConfig.apiUrl,
      environment: envConfig.environment,
      supabaseUrl: envConfig.supabaseUrl,
      supabaseAnonKey: envConfig.supabaseAnonKey,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    plugins: ['expo-router', 'expo-secure-store'],
  };
};
