/**
 * Push Notifications Service
 *
 * Handles push notification setup, permissions, and token management.
 * Uses Expo Notifications for cross-platform support.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

/**
 * Request notification permissions and get push token
 */
export async function registerForPushNotifications(): Promise<PushToken | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Android requires notification channel setup
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannels();
    }

    return {
      token: tokenData.data,
      type: 'expo',
    };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Set up Android notification channels for different notification types
 */
async function setupAndroidNotificationChannels() {
  // New offers channel
  await Notifications.setNotificationChannelAsync('offers', {
    name: 'New Offers',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#19e680',
    description: 'Notifications for new trade offers',
  });

  // Messages channel
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3b82f6',
    description: 'Notifications for new messages',
  });

  // Trade updates channel
  await Notifications.setNotificationChannelAsync('trades', {
    name: 'Trade Updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'Notifications for trade status changes',
  });

  // General channel
  await Notifications.setNotificationChannelAsync('general', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: 'General app notifications',
  });
}

/**
 * Save push token to database for the current user
 */
export async function savePushTokenToDatabase(userId: string, pushToken: PushToken) {
  try {
    // Store in a push_tokens table (you'll need to create this in Supabase)
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: pushToken.token,
        token_type: pushToken.type,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,token',
      });

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

/**
 * Remove push token from database (on logout)
 */
export async function removePushToken(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Error removing push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
}

/**
 * Schedule a local notification (for testing or local reminders)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger ?? null, // null = show immediately
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications from the notification center
 */
export async function dismissAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Notification types for the app
 */
export type NotificationType =
  | 'new_offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'new_message'
  | 'trade_completed'
  | 'listing_liked';

/**
 * Handle notification data based on type
 */
export function getNotificationRoute(type: NotificationType, data: Record<string, unknown>): string {
  switch (type) {
    case 'new_offer':
    case 'offer_accepted':
    case 'offer_rejected':
      return `/chat/${data.offerId}`;
    case 'new_message':
      return `/chat/${data.conversationId}`;
    case 'trade_completed':
      return `/trades`;
    case 'listing_liked':
      return `/listing/${data.listingId}`;
    default:
      return '/(tabs)';
  }
}
