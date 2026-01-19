import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { useNetwork } from '../hooks/useNetwork';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isOffline, isChecking, checkNetwork } = useNetwork();

  if (!isOffline) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xs }]}>
      <View style={styles.content}>
        <MaterialIcons name="wifi-off" size={18} color={Colors.white} />
        <Text style={styles.text}>No internet connection</Text>
        <TouchableOpacity
          onPress={checkNetwork}
          disabled={isChecking}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {isChecking ? 'Checking...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  text: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  retryText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
});
