import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { MOCK_LISTINGS } from '../../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  estimatedValue: number;
  images: string[];
  location?: string;
  user: {
    id: string;
    displayName: string;
  };
}

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Sports', 'Music', 'Games'];
const DISTANCES = ['Any', '5 miles', '10 miles', '25 miles', '50 miles'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWant, setShowWant] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('25 miles');

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const listings = MOCK_LISTINGS as Listing[];
  const currentListing = listings[currentIndex];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        if (gesture.dx > 50) {
          setShowWant(true);
          setShowSkip(false);
        } else if (gesture.dx < -50) {
          setShowSkip(true);
          setShowWant(false);
        } else {
          setShowWant(false);
          setShowSkip(false);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    setShowWant(false);
    setShowSkip(false);
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const nextCard = () => {
    setShowWant(false);
    setShowSkip(false);
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  };

  const handleSkip = () => {
    setShowSkip(true);
    setTimeout(() => swipeLeft(), 100);
  };

  const handleTrade = () => {
    if (currentListing) {
      router.push(`/offer/${currentListing.id}`);
    }
  };

  const handleCash = () => {
    setShowWant(true);
    setTimeout(() => swipeRight(), 100);
  };

  if (!currentListing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No more items to discover</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <MaterialIcons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Barter</Text>
          <View style={styles.liveFeedBadge}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <View style={[styles.liveDot, { backgroundColor: colors.textMuted, marginLeft: 4 }]} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="tune" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Card Area */}
      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Card Image */}
          <Image
            source={{ uri: currentListing.images[0] || 'https://via.placeholder.com/400' }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Gradient Overlays */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent']}
            style={styles.topGradient}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={styles.bottomGradient}
          />

          {/* WANT Stamp */}
          {showWant && (
            <View style={styles.wantStamp}>
              <Text style={styles.wantStampText}>WANT</Text>
            </View>
          )}

          {/* SKIP Stamp */}
          {showSkip && (
            <View style={styles.skipStamp}>
              <Text style={styles.skipStampText}>SKIP</Text>
            </View>
          )}

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>
                  {currentListing.category?.toUpperCase() || 'ITEM'}
                </Text>
              </View>
              <View style={styles.conditionTag}>
                <Text style={styles.conditionTagText}>
                  {currentListing.condition || 'Good Condition'}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>{currentListing.title}</Text>

            {/* Location */}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>
                {currentListing.location || 'Brooklyn, 2.5 miles away'}
              </Text>
            </View>

            {/* Watchers */}
            <View style={styles.watchersRow}>
              <View style={styles.watcherAvatars}>
                <View style={[styles.watcherAvatar, { backgroundColor: '#64748b' }]}>
                  <Text style={styles.watcherInitials}>JD</Text>
                </View>
                <View style={[styles.watcherAvatar, { backgroundColor: '#94a3b8', marginLeft: -8 }]}>
                  <Text style={styles.watcherInitials}>MK</Text>
                </View>
              </View>
              <Text style={styles.watchersText}>4 users watching this item</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <MaterialIcons name="close" size={28} color="#ef4444" />
          </TouchableOpacity>

          {/* Trade Button (Center) */}
          <TouchableOpacity style={styles.tradeButton} onPress={handleTrade}>
            <MaterialIcons name="sync" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Want/Like Button */}
          <TouchableOpacity style={styles.wantButton} onPress={handleCash}>
            <MaterialIcons name="photo-camera" size={28} color="#0A0A0A" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
          SWIPE RIGHT TO TRADE  •  SWIPE LEFT TO SKIP
        </Text>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, backgroundColor: colors.backgroundLight }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.surface }]}
                onPress={() => setShowFilters(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>Category</Text>
                <View style={styles.filterChips}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: colors.textSecondary },
                          selectedCategory === cat && { color: colors.textInverse },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Distance Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>Distance</Text>
                <View style={styles.filterChips}>
                  {DISTANCES.map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      style={[
                        styles.filterChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedDistance === dist && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedDistance(dist)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: colors.textSecondary },
                          selectedDistance === dist && { color: colors.textInverse },
                        ]}
                      >
                        {dist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={[styles.applyButtonText, { color: colors.textInverse }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112119',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  liveFeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#19e680',
  },
  liveFeedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#19e680',
    letterSpacing: 1.5,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  wantStamp: {
    position: 'absolute',
    top: 40,
    right: 40,
    transform: [{ rotate: '12deg' }],
    borderWidth: 4,
    borderColor: '#19e680',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wantStampText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#19e680',
  },
  skipStamp: {
    position: 'absolute',
    top: 40,
    left: 40,
    transform: [{ rotate: '-12deg' }],
    borderWidth: 4,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipStampText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#ef4444',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(25, 230, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 128, 0.3)',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#19e680',
    letterSpacing: 0.5,
  },
  conditionTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conditionTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  watchersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  watcherAvatars: {
    flexDirection: 'row',
  },
  watcherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watcherInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  watchersText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionsContainer: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 100,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  skipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  wantButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#19e680',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#19e680',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#112119',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: '#19e680',
    borderColor: '#19e680',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  filterChipTextActive: {
    color: '#0A0A0A',
  },
  applyButton: {
    backgroundColor: '#19e680',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});
