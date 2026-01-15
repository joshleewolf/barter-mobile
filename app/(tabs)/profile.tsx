import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { MOCK_USER_LISTINGS } from '../../services/mockData';

interface UserStats {
  activeListings: number;
  pendingOffers: number;
  completedTrades: number;
}

interface Listing {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setStats({
      activeListings: MOCK_USER_LISTINGS.length,
      pendingOffers: 3,
      completedTrades: 12,
    });
    setListings(MOCK_USER_LISTINGS as Listing[]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleMenuItemPress = (label: string) => {
    switch (label) {
      case 'Edit Profile':
        Alert.alert('Edit Profile', 'Profile editing will be available soon!');
        break;
      case 'Appearance':
        router.push('/settings');
        break;
      case 'Notifications':
        Alert.alert('Notifications', 'Notification preferences will be available soon!');
        break;
      case 'Privacy & Security':
        Alert.alert('Privacy & Security', 'Privacy settings will be available soon!');
        break;
      case 'Help & Support':
        Alert.alert(
          'Help & Support',
          'Need help? Contact us at support@barter.app',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 'About':
        Alert.alert(
          'About Barter',
          'Barter v1.0.0\n\nSwap. Trade. Discover.\n\nA peer-to-peer trading platform for the modern age.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile' },
    { icon: 'palette', label: 'Appearance' },
    { icon: 'notifications-none', label: 'Notifications' },
    { icon: 'lock-outline', label: 'Privacy & Security' },
    { icon: 'help-outline', label: 'Help & Support' },
    { icon: 'info-outline', label: 'About' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <LinearGradient
            colors={['rgba(25, 230, 128, 0.15)', 'rgba(25, 230, 128, 0)']}
            style={styles.profileGradient}
          />
          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {user?.displayName?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="verified" size={16} color={colors.textInverse} />
              </View>
            </View>

            {/* User Info */}
            <Text style={[styles.displayName, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
            <Text style={[styles.username, { color: colors.textMuted }]}>@{user?.username || 'username'}</Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={18} color={colors.primary} />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {user?.rating?.toFixed(1) || '4.9'}
              </Text>
              <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                ({user?.totalTrades || 0} trades)
              </Text>
            </View>

            {/* Member Since */}
            <View style={[styles.memberBadge, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="schedule" size={14} color={colors.textMuted} />
              <Text style={[styles.memberText, { color: colors.textMuted }]}>Member since 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(25, 230, 128, 0.15)' }]}>
                <MaterialIcons name="inventory-2" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.activeListings}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active Listings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <MaterialIcons name="pending-actions" size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.pendingOffers}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <MaterialIcons name="swap-horiz" size={20} color={colors.info} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>{stats.completedTrades}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Trades</Text>
            </View>
          </View>
        )}

        {/* My Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="grid-view" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Listings</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/create')}
            >
              <MaterialIcons name="add" size={18} color={colors.textInverse} />
              <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add New</Text>
            </TouchableOpacity>
          </View>

          {listings.length > 0 ? (
            <View style={styles.listingsGrid}>
              {listings.slice(0, 4).map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={[styles.listingCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/listing/${listing.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: listing.images[0] || 'https://via.placeholder.com/150' }}
                    style={styles.listingImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.listingGradient}
                  />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={[styles.listingValue, { color: colors.primary }]}>${listing.estimatedValue}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: listing.status === 'ACTIVE' ? colors.primary : '#64748b' },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyListings, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="add-circle-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No listings yet</Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={[styles.createButtonText, { color: colors.textInverse }]}>Create Your First Listing</Text>
              </TouchableOpacity>
            </View>
          )}

          {listings.length > 4 && (
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => Alert.alert('My Listings', `You have ${listings.length} active listings`)}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Listings</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="tune" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          </View>

          <View style={[styles.menuCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.border }],
                ]}
                activeOpacity={0.7}
                onPress={() => handleMenuItemPress(item.label)}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={colors.textSecondary} />
                </View>
                <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={22} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(25, 230, 128, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 14,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  memberText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listingCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  listingInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  listingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 12,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyListings: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
