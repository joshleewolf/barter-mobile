import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme, isDark } = useTheme();

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(25, 230, 128, 0.15)' : 'rgba(0, 0, 0, 0.05)' }]}>
                <MaterialIcons
                  name={isDark ? 'dark-mode' : 'light-mode'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.surface, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Theme Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PREVIEW</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewAvatarText}>B</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Barter App</Text>
                <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>Theme Preview</Text>
              </View>
            </View>

            <View style={styles.previewButtons}>
              <View style={[styles.previewButtonPrimary, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewButtonPrimaryText}>Primary</Text>
              </View>
              <View style={[styles.previewButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.previewButtonSecondaryText, { color: colors.text }]}>Secondary</Text>
              </View>
            </View>

            <View style={[styles.previewMessage, { backgroundColor: colors.surface }]}>
              <Text style={[styles.previewMessageText, { color: colors.textSecondary }]}>
                This is how messages will look in {isDark ? 'dark' : 'light'} mode.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 13,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  previewButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  previewButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  previewButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewMessage: {
    padding: 16,
    borderRadius: 12,
  },
  previewMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
