import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';

// Component to initialize notifications after auth is ready
function NotificationInitializer() {
  const { requestPermissions, isRegistered } = useNotifications();

  useEffect(() => {
    // Request permissions on mount (will only register if user is logged in)
    if (!isRegistered) {
      requestPermissions();
    }
  }, [isRegistered, requestPermissions]);

  return null;
}

function AppContent() {
  const auth = useAuthProvider();
  const { isDark } = useTheme();

  return (
    <AuthContext.Provider value={auth}>
      <NotificationInitializer />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        <Stack.Screen name="listing/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="offer/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="map" options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="trade-unlocked" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
