import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_OFFERS } from '../../services/mockData';
import { useTheme } from '../../hooks/useTheme';

interface Offer {
  id: string;
  type: 'CASH' | 'ITEM' | 'COMBO';
  status: string;
  cashAmount?: number;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    images: string[];
  };
  offeredListing?: {
    title: string;
    images: string[];
  };
  fromUser?: {
    displayName: string;
    rating: number;
  };
  toUser?: {
    displayName: string;
  };
}

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [activeTab]);

  const loadOffers = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = activeTab === 'received' ? MOCK_OFFERS.received : MOCK_OFFERS.sent;
    setOffers(data as Offer[]);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'ACCEPTED': return '#19e680';
      case 'REJECTED': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Declined';
      default: return status;
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'CASH': return 'payments';
      case 'ITEM': return 'inventory-2';
      case 'COMBO': return 'swap-horiz';
      default: return 'swap-horiz';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const renderOffer = ({ item }: { item: Offer }) => (
    <TouchableOpacity
      style={[styles.offerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Images Stack */}
      <View style={styles.imagesContainer}>
        <Image
          source={{ uri: item.listing.images[0] || 'https://via.placeholder.com/80' }}
          style={[styles.mainImage, { backgroundColor: colors.surface }]}
        />
        {item.offeredListing && (
          <View style={[styles.secondaryImageContainer, { backgroundColor: colors.background }]}>
            <Image
              source={{ uri: item.offeredListing.images[0] || 'https://via.placeholder.com/40' }}
              style={styles.secondaryImage}
            />
          </View>
        )}
        <View style={[styles.offerTypeIcon, { backgroundColor: `${getStatusColor(item.status)}20`, borderColor: colors.background }]}>
          <MaterialIcons
            name={getOfferIcon(item.type) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.offerContent}>
        {/* Status and Time */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={1}>
          {item.listing.title}
        </Text>

        {/* Offer Details */}
        <View style={styles.offerDetails}>
          {item.type === 'CASH' && (
            <Text style={[styles.offerValue, { color: colors.primary }]}>${item.cashAmount} Cash Offer</Text>
          )}
          {item.type === 'ITEM' && (
            <Text style={[styles.offerValue, { color: colors.primary }]} numberOfLines={1}>
              Trading: {item.offeredListing?.title}
            </Text>
          )}
          {item.type === 'COMBO' && (
            <Text style={[styles.offerValue, { color: colors.primary }]}>
              Trade + ${item.cashAmount}
            </Text>
          )}
        </View>

        {/* User Row */}
        <View style={styles.userRow}>
          <View style={[styles.userAvatar, { backgroundColor: colors.surface }]}>
            <Text style={[styles.userInitial, { color: colors.text }]}>
              {activeTab === 'received'
                ? item.fromUser?.displayName?.charAt(0) || '?'
                : item.toUser?.displayName?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textMuted }]}>
            {activeTab === 'received'
              ? item.fromUser?.displayName
              : item.toUser?.displayName}
          </Text>
          {activeTab === 'received' && item.fromUser?.rating && (
            <View style={[styles.ratingBadge, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="star" size={12} color={colors.primary} />
              <Text style={[styles.ratingText, { color: colors.primary }]}>{item.fromUser.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const pendingCount = offers.filter(o => o.status === 'PENDING').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trades</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === 'received' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab('received')}
          >
            <MaterialIcons
              name="call-received"
              size={18}
              color={activeTab === 'received' ? colors.textInverse : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === 'received' && { color: colors.textInverse }
            ]}>
              Received
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === 'sent' && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab('sent')}
          >
            <MaterialIcons
              name="call-made"
              size={18}
              color={activeTab === 'sent' ? colors.textInverse : colors.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === 'sent' && { color: colors.textInverse }
            ]}>
              Sent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offers List */}
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons
                name={activeTab === 'received' ? 'call-received' : 'call-made'}
                size={48}
                color={colors.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No {activeTab} offers yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {activeTab === 'received'
                ? 'When someone makes an offer on your items, it will appear here'
                : 'Swipe right on items you want to start making offers'}
            </Text>
            {activeTab === 'sent' && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/')}
              >
                <MaterialIcons name="explore" size={20} color={colors.textInverse} />
                <Text style={[styles.emptyButtonText, { color: colors.textInverse }]}>Discover Items</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  imagesContainer: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  mainImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  secondaryImageContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 8,
    padding: 2,
  },
  secondaryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  offerTypeIcon: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  offerContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  offerDetails: {
    marginBottom: 8,
  },
  offerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 10,
    fontWeight: '700',
  },
  userName: {
    fontSize: 13,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
