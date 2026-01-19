import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { MOCK_CONVERSATIONS } from '../../services/mockData';

interface Conversation {
  id: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  otherParticipant?: {
    displayName: string;
    avatar?: string;
  };
  offer?: {
    listing: {
      title: string;
      images: string[];
    };
    status?: string;
  };
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setConversations(MOCK_CONVERSATIONS as unknown as Conversation[]);
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACCEPTED': return '#19e680';
      case 'PENDING': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Trade Accepted';
      case 'PENDING': return 'Pending';
      case 'REJECTED': return 'Declined';
      default: return 'Active';
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active Trades' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Item Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.offer?.listing.images[0] || 'https://via.placeholder.com/80' }}
          style={[styles.itemImage, { backgroundColor: colors.surface }]}
        />
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadText, { color: colors.textInverse }]}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.offer?.status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.offer?.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.offer?.status) }]}>
              {getStatusLabel(item.offer?.status)}
            </Text>
          </View>
          {item.lastMessage && (
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        {/* Item Title */}
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {item.offer?.listing.title || 'Trade Offer'}
        </Text>

        {/* User and Message */}
        <View style={styles.messageRow}>
          <View style={[styles.userAvatar, { backgroundColor: colors.surface }]}>
            {item.otherParticipant?.avatar ? (
              <Image source={{ uri: item.otherParticipant.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitial, { color: colors.text }]}>
                {item.otherParticipant?.displayName?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View style={styles.messageContent}>
            <Text style={[styles.userName, { color: colors.textMuted }]}>{item.otherParticipant?.displayName || 'Unknown'}</Text>
            {item.lastMessage && (
              <Text
                style={[styles.lastMessage, { color: colors.textMuted }, item.unreadCount > 0 && { color: colors.text, fontWeight: '500' }]}
                numberOfLines={1}
              >
                {item.lastMessage.content}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Chevron */}
      <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowSearch(true)}
          >
            <MaterialIcons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                { backgroundColor: colors.surface },
                activeFilter === filter.key && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.textMuted },
                activeFilter === filter.key && { color: colors.textInverse }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
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
              <MaterialIcons name="chat-bubble-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Start discovering items to make trades and chat with other users
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/')}
            >
              <MaterialIcons name="explore" size={20} color={colors.textInverse} />
              <Text style={[styles.emptyButtonText, { color: colors.textInverse }]}>Start Discovering</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={[styles.searchModalOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.searchModalContent, { paddingTop: insets.top + 16 }]}>
            {/* Search Header */}
            <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="search" size={20} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search messages..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.searchCancelButton}
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.searchCancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            <FlatList
              data={conversations.filter(c =>
                c.otherParticipant?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.offer?.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.searchEmptyState}>
                  <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
                  <Text style={[styles.searchEmptyText, { color: colors.textMuted }]}>
                    {searchQuery.length > 0 ? 'No results found' : 'Search for conversations'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  filterTabActive: {},
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {},
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    marginTop: 2,
  },
  lastMessageUnread: {
    fontWeight: '500',
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
  searchModalOverlay: {
    flex: 1,
  },
  searchModalContent: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchCancelButton: {
    paddingHorizontal: 8,
  },
  searchCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  searchEmptyText: {
    fontSize: 16,
  },
});
