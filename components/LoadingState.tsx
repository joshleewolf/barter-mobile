import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSizes } from '../constants/theme';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function LoadingSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: LoadingSkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <LoadingSkeleton height={200} borderRadius={16} />
      <View style={styles.cardSkeletonContent}>
        <LoadingSkeleton width="70%" height={24} />
        <LoadingSkeleton width="50%" height={16} style={{ marginTop: 8 }} />
        <LoadingSkeleton width="30%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItemSkeleton}>
      <LoadingSkeleton width={60} height={60} borderRadius={12} />
      <View style={styles.listItemContent}>
        <LoadingSkeleton width="80%" height={18} />
        <LoadingSkeleton width="60%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  skeleton: {
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  cardSkeleton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardSkeletonContent: {
    padding: Spacing.lg,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
});
