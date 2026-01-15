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

  const [stats, setStats] = useState<UserStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
    setLoading(false);
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
          [
            { text: 'OK', style: 'default' },
          ]
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
    { icon: 'notifications-none', label: 'Notifications' },
    { icon: 'lock-outline', label: 'Privacy & Security' },
    { icon: 'help-outline', label: 'Help & Support' },
    { icon: 'info-outline', label: 'About' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <MaterialIcons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(25, 230, 128, 0.15)', 'rgba(25, 230, 128, 0)']}
            style={styles.profileGradient}
          />
          <View style={styles.profileContent}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color="#0A0A0A" />
              </View>
            </View>

            {/* User Info */}
            <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.username}>@{user?.username || 'username'}</Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={18} color="#19e680" />
              <Text style={styles.ratingText}>
                {user?.rating?.toFixed(1) || '4.9'}
              </Text>
              <Text style={styles.ratingCount}>
                ({user?.totalTrades || 0} trades)
              </Text>
            </View>

            {/* Member Since */}
            <View style={styles.memberBadge}>
              <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.memberText}>Member since 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(25, 230, 128, 0.15)' }]}>
                <MaterialIcons name="inventory-2" size={20} color="#19e680" />
              </View>
              <Text style={styles.statNumber}>{stats.activeListings}</Text>
              <Text style={styles.statLabel}>Active Listings</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <MaterialIcons name="pending-actions" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.statNumber}>{stats.pendingOffers}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <MaterialIcons name="swap-horiz" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statNumber}>{stats.completedTrades}</Text>
              <Text style={styles.statLabel}>Trades</Text>
            </View>
          </View>
        )}

        {/* My Listings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="grid-view" size={20} color="#19e680" />
              <Text style={styles.sectionTitle}>My Listings</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <MaterialIcons name="add" size={18} color="#0A0A0A" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {listings.length > 0 ? (
            <View style={styles.listingsGrid}>
              {listings.slice(0, 4).map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
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
                    <Text style={styles.listingValue}>${listing.estimatedValue}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: listing.status === 'ACTIVE' ? '#19e680' : '#64748b' },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyListings}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="add-circle-outline" size={32} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.emptyText}>No listings yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.createButtonText}>Create Your First Listing</Text>
              </TouchableOpacity>
            </View>
          )}

          {listings.length > 4 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => Alert.alert('My Listings', `You have ${listings.length} active listings`)}
            >
              <Text style={styles.viewAllText}>View All Listings</Text>
              <MaterialIcons name="chevron-right" size={20} color="#19e680" />
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="tune" size={20} color="#19e680" />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => handleMenuItemPress(item.label)}
              >
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name={item.icon as any} size={22} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
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
    backgroundColor: '#0A0A0A',
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
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#19e680',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(25, 230, 128, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#19e680',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
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
    color: '#fff',
  },
  ratingCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 9999,
  },
  memberText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
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
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#19e680',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: '#19e680',
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
    backgroundColor: 'rgba(25, 230, 128, 0.1)',
    borderRadius: 12,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#19e680',
  },
  emptyListings: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#19e680',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
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
    color: '#ef4444',
  },
});
