import Constants from 'expo-constants';

interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const extra = Constants.expoConfig?.extra ?? {};

export const config: AppConfig = {
  apiUrl: extra.apiUrl ?? 'http://localhost:3001/api/v1',
  environment: extra.environment ?? 'development',
  isDevelopment: (extra.environment ?? 'development') === 'development',
  isStaging: extra.environment === 'staging',
  isProduction: extra.environment === 'production',
  supabaseUrl: extra.supabaseUrl ?? 'https://zycjweqawglcddmfyvvm.supabase.co',
  supabaseAnonKey: extra.supabaseAnonKey ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5Y2p3ZXFhd2dsY2RkbWZ5dnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTMzNzMsImV4cCI6MjA4NDE2OTM3M30.YMRzh8udxuTm5aZq5oUkahmWg1TsLcEnk2YKMMsZ108',
};
