import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const CATEGORIES = [
  { id: 'vintage-clothing', label: 'Vintage Clothing', icon: 'checkroom' },
  { id: 'cars', label: 'Cars & Vehicles', icon: 'directions-car' },
  { id: 'electronics', label: 'Electronics', icon: 'devices' },
  { id: 'sneakers', label: 'Sneakers', icon: 'sports-basketball' },
  { id: 'furniture', label: 'Furniture', icon: 'chair' },
  { id: 'art', label: 'Art & Collectibles', icon: 'palette' },
  { id: 'music', label: 'Music & Instruments', icon: 'music-note' },
  { id: 'sports', label: 'Sports Equipment', icon: 'fitness-center' },
  { id: 'books', label: 'Books & Media', icon: 'menu-book' },
  { id: 'jewelry', label: 'Jewelry & Watches', icon: 'watch' },
  { id: 'gaming', label: 'Gaming', icon: 'sports-esports' },
  { id: 'home', label: 'Home & Garden', icon: 'home' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();

  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [saving, setSaving] = useState(false);

  const styles = createStyles(colors);

  const toggleInterest = (categoryId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const saveInterests = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Required', 'Please select at least one interest');
      return;
    }

    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ interests: selectedInterests })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      setShowInterestsModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save interests');
    } finally {
      setSaving(false);
    }
  };

  const openInterestsModal = () => {
    setSelectedInterests(user?.interests || []);
    setShowInterestsModal(true);
  };

  // Get labels for current interests
  const currentInterestLabels = (user?.interests || [])
    .map(id => CATEGORIES.find(c => c.id === id)?.label)
    .filter(Boolean)
    .join(', ');

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

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>INTERESTS</Text>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={openInterestsModal}
          >
            <View style={styles.settingRow}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(25, 230, 128, 0.15)' }]}>
                <MaterialIcons name="category" size={22} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>My Interests</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                  {currentInterestLabels || 'No interests selected'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
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

      {/* Interests Modal */}
      <Modal
        visible={showInterestsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInterestsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowInterestsModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Interests</Text>
            <TouchableOpacity onPress={saveInterests} disabled={saving}>
              <Text style={[styles.modalSave, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Select the categories you're interested in. We'll prioritize showing you items that match.
            </Text>

            <View style={styles.categoriesGrid}>
              {CATEGORIES.map(category => {
                const isSelected = selectedInterests.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => toggleInterest(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: colors.background },
                      isSelected && { backgroundColor: colors.primary },
                    ]}>
                      <MaterialIcons
                        name={category.icon as any}
                        size={24}
                        color={isSelected ? colors.background : colors.textSecondary}
                      />
                    </View>
                    <Text style={[
                      styles.categoryLabel,
                      { color: colors.text },
                      isSelected && { color: colors.primary },
                    ]}>
                      {category.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <MaterialIcons name="check" size={12} color={colors.background} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.selectedCount, { color: colors.textMuted }]}>
              {selectedInterests.length} selected
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    position: 'relative',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCount: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
  },
});
