/**
 * useNotifications Hook
 *
 * Manages push notification setup, listeners, and navigation handling.
 * Gracefully handles running in Expo Go where native modules aren't available.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  registerForPushNotifications,
  savePushTokenToDatabase,
  removePushToken,
  getNotificationRoute,
  type PushToken,
  type NotificationType,
} from '../services/notifications';
import { useAuth } from './useAuth';

// Check if we're in Expo Go (limited native module support)
const isExpoGo = Constants.appOwnership === 'expo';

interface UseNotificationsReturn {
  pushToken: PushToken | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  lastNotification: Notifications.Notification | null;
}

export function useNotifications(): UseNotificationsReturn {
  const router = useRouter();
  const { user } = useAuth();

  const [pushToken, setPushToken] = useState<PushToken | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  // Refs for notification listeners
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Register for push notifications
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Skip in Expo Go - notifications require a development build
    if (isExpoGo) {
      console.log('Push notifications require a development build');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await registerForPushNotifications();

      if (!token) {
        setError('Failed to get push notification permissions');
        setIsLoading(false);
        return false;
      }

      setPushToken(token);

      // Save token to database if user is logged in
      if (user?.id) {
        const saved = await savePushTokenToDatabase(user.id, token);
        if (saved) {
          setIsRegistered(true);
        }
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
      return false;
    }
  }, [user?.id]);

  // Initialize notifications when user logs in
  useEffect(() => {
    // Skip in Expo Go
    if (isExpoGo) return;

    if (user?.id && !isRegistered) {
      requestPermissions();
    }
  }, [user?.id, isRegistered, requestPermissions]);

  // Clean up on logout
  useEffect(() => {
    // Skip in Expo Go
    if (isExpoGo) return;

    return () => {
      // Remove token when hook unmounts (user logs out)
      if (pushToken && user?.id) {
        removePushToken(user.id, pushToken.token);
      }
    };
  }, [pushToken, user?.id]);

  // Set up notification listeners
  useEffect(() => {
    // Skip in Expo Go - these APIs aren't fully available
    if (isExpoGo) return;

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setLastNotification(notification);
        console.log('Notification received:', notification);
      }
    );

    // Listener for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        const data = notification.request.content.data as {
          type?: NotificationType;
          [key: string]: unknown;
        };

        console.log('Notification tapped:', data);

        // Navigate to appropriate screen based on notification type
        if (data.type) {
          const route = getNotificationRoute(data.type, data);
          router.push(route as any);
        }
      }
    );

    // Check if app was opened from a notification
    // Wrap in try-catch as this can fail in some environments
    const checkLastNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const data = response.notification.request.content.data as {
            type?: NotificationType;
            [key: string]: unknown;
          };

          if (data.type) {
            const route = getNotificationRoute(data.type, data);
            // Small delay to ensure app is ready
            setTimeout(() => {
              router.push(route as any);
            }, 500);
          }
        }
      } catch (err) {
        // Silently fail - this is expected in some environments
        console.log('Could not check last notification response');
      }
    };

    checkLastNotification();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return {
    pushToken,
    isRegistered,
    isLoading,
    error,
    requestPermissions,
    lastNotification,
  };
}

/**
 * Hook to handle notification badge count
 */
export function useNotificationBadge() {
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    // Skip in Expo Go
    if (isExpoGo) return;

    // Get initial badge count
    Notifications.getBadgeCountAsync()
      .then(setBadgeCount)
      .catch(() => {
        // Silently fail
      });
  }, []);

  const updateBadge = useCallback(async (count: number) => {
    if (isExpoGo) return;
    try {
      await Notifications.setBadgeCountAsync(count);
      setBadgeCount(count);
    } catch {
      // Silently fail
    }
  }, []);

  const incrementBadge = useCallback(async () => {
    if (isExpoGo) return;
    try {
      const newCount = badgeCount + 1;
      await Notifications.setBadgeCountAsync(newCount);
      setBadgeCount(newCount);
    } catch {
      // Silently fail
    }
  }, [badgeCount]);

  const clearBadge = useCallback(async () => {
    if (isExpoGo) return;
    try {
      await Notifications.setBadgeCountAsync(0);
      setBadgeCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    badgeCount,
    updateBadge,
    incrementBadge,
    clearBadge,
  };
}
