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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
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
      style={styles.conversationCard}
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.7}
    >
      {/* Item Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.offer?.listing.images[0] || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
        />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
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
            <Text style={styles.timeText}>
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>

        {/* Item Title */}
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.offer?.listing.title || 'Trade Offer'}
        </Text>

        {/* User and Message */}
        <View style={styles.messageRow}>
          <View style={styles.userAvatar}>
            {item.otherParticipant?.avatar ? (
              <Image source={{ uri: item.otherParticipant.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>
                {item.otherParticipant?.displayName?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View style={styles.messageContent}>
            <Text style={styles.userName}>{item.otherParticipant?.displayName || 'Unknown'}</Text>
            {item.lastMessage && (
              <Text
                style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]}
                numberOfLines={1}
              >
                {item.lastMessage.content}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Chevron */}
      <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(true)}
          >
            <MaterialIcons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
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
            tintColor="#19e680"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="chat-bubble-outline" size={48} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start discovering items to make trades and chat with other users
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/')}
            >
              <MaterialIcons name="explore" size={20} color="#0A0A0A" />
              <Text style={styles.emptyButtonText}>Start Discovering</Text>
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
        <View style={styles.searchModalOverlay}>
          <View style={[styles.searchModalContent, { paddingTop: insets.top + 16 }]}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <View style={styles.searchInputContainer}>
                <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search messages..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.5)" />
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
                <Text style={styles.searchCancelText}>Cancel</Text>
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
                  <MaterialIcons name="search-off" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.searchEmptyText}>
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
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterTabActive: {
    backgroundColor: '#19e680',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterTextActive: {
    color: '#0A0A0A',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#19e680',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A0A',
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
    color: 'rgba(255,255,255,0.4)',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#fff',
  },
  messageContent: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  lastMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  lastMessageUnread: {
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#19e680',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  searchCancelButton: {
    paddingHorizontal: 8,
  },
  searchCancelText: {
    fontSize: 16,
    color: '#19e680',
    fontWeight: '600',
  },
  searchEmptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  searchEmptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
});
