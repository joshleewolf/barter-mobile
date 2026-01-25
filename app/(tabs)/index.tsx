import { useState, useRef, useMemo, useEffect } from 'react';
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
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/theme';
import { MOCK_LISTINGS, MOCK_USER_LISTINGS } from '../../services/mockData';
import { tradeService } from '../../services/matchService';
import Constants from 'expo-constants';

// Check if we're in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Map onboarding category IDs to listing category names
const CATEGORY_ID_TO_NAME: Record<string, string[]> = {
  'vintage-clothing': ['Clothing', 'Vintage'],
  'cars': ['Cars', 'Vehicles', 'Automotive'],
  'electronics': ['Electronics', 'Services'], // Services often tech-related
  'sneakers': ['Sneakers', 'Shoes', 'Footwear'],
  'furniture': ['Furniture', 'Home & Garden'],
  'art': ['Art', 'Collectibles', 'Services'],
  'music': ['Music'],
  'sports': ['Sports'],
  'books': ['Books', 'Media'],
  'jewelry': ['Jewelry', 'Watches'],
  'gaming': ['Games', 'Gaming'],
  'home': ['Home', 'Home & Garden'],
};
import {
  useFavorites,
  useSelectedTradeItem,
  useFilterPreferences,
  useViewModePreference,
} from '../../hooks/useStorage';

interface UserListing {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  status: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface ListingLocation {
  latitude: number;
  longitude: number;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string | null;
  estimatedValue: number;
  images: string[];
  location?: string | ListingLocation;
  user: {
    id: string;
    displayName: string;
  };
}

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Sports', 'Music', 'Games'];
const DISTANCES = ['Any', '5 miles', '10 miles', '25 miles', '50 miles'];

// Helper to extract location text from location field (string or object)
const getLocationText = (location?: string | ListingLocation, fallback = '2.5 mi away'): string => {
  if (!location) return fallback;
  if (typeof location === 'string') return location;
  return location.name || fallback;
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Persisted state - pass user.id so it reloads when user changes (login/logout)
  const [favorites, toggleFavorite] = useFavorites();
  const [selectedTradeItem, setSelectedTradeItem, isTradeItemLoaded] = useSelectedTradeItem(user?.id);
  const [filterPrefs, updateFilterPrefs] = useFilterPreferences();
  const [viewMode, setViewModePreference] = useViewModePreference();

  // Derived values from filter preferences
  const selectedCategory = filterPrefs.category;
  const selectedDistance = filterPrefs.distance;
  const currentLocation = filterPrefs.location;

  // Helper functions to update filter preferences
  const setSelectedCategory = (category: string) => updateFilterPrefs({ category });
  const setSelectedDistance = (distance: string) => updateFilterPrefs({ distance });
  const setCurrentLocation = (location: string) => updateFilterPrefs({ location });

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pinPosition, setPinPosition] = useState({ x: 0.5, y: 0.5 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [dismissedInfoCard, setDismissedInfoCard] = useState(false);

  const userListings = MOCK_USER_LISTINGS as UserListing[];

  // Auto-show trade item selection modal when user has no item selected (fresh login)
  useEffect(() => {
    if (isTradeItemLoaded && selectedTradeItem === null) {
      const timer = setTimeout(() => {
        setShowItemSelectionModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isTradeItemLoaded, selectedTradeItem, user?.id]);

  // Cycle through all 3 view modes: swipe → grid → map → swipe
  const cycleViewMode = () => {
    if (viewMode === 'swipe') {
      setViewModePreference('grid');
    } else if (viewMode === 'grid') {
      setViewModePreference('map');
    } else {
      setViewModePreference('swipe');
      // When switching to swipe mode, prompt for item selection if none selected
      if (!selectedTradeItem) {
        setShowItemSelectionModal(true);
      }
    }
  };

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Filter listings based on user's selected interests from onboarding
  const allListings = MOCK_LISTINGS as Listing[];
  const { matchedListings, hasMatchingListings } = useMemo(() => {
    const matched = allListings.filter((listing) => {
      // If user has no interests set, show all listings
      if (!user?.interests || user.interests.length === 0) {
        return true;
      }

      // Check if listing category matches any of user's interests
      const listingCategory = listing.category?.toLowerCase() || '';
      return user.interests.some((interestId) => {
        const matchingCategories = CATEGORY_ID_TO_NAME[interestId] || [];
        return matchingCategories.some(
          (cat) => cat.toLowerCase() === listingCategory ||
                   listingCategory.includes(cat.toLowerCase())
        );
      });
    });
    return { matchedListings: matched, hasMatchingListings: matched.length > 0 };
  }, [user?.interests, allListings]);

  // Show info card as first "card" if no matching listings and user has interests set
  const showInfoCard = !hasMatchingListings && user?.interests && user.interests.length > 0 && !dismissedInfoCard;

  // Use matched listings if available, otherwise show all listings (after info card is dismissed or as fallback)
  const listings = hasMatchingListings ? matchedListings : allListings;

  // Adjust index: if showing info card, index 0 is the info card, actual listings start at index 1
  const effectiveIndex = showInfoCard ? currentIndex - 1 : currentIndex;
  const currentListing = showInfoCard && currentIndex === 0 ? null : listings[effectiveIndex];

  // Ref to hold the latest callback - this solves the stale closure problem
  const swipeHandlerRef = useRef<{
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
    onReset: () => void;
  }>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeHandlerRef.current?.onSwipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeHandlerRef.current?.onSwipeLeft();
        } else {
          swipeHandlerRef.current?.onReset();
        }
      },
    })
  ).current;

  const resetPosition = () => {
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
    }).start(() => {
      // Record pass
      if (currentListing) {
        tradeService.recordPass(currentListing.id, currentListing.user.id);
      }
      nextCard();
    });
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Record interest and check for mutual trade opportunity
      if (currentListing) {
        const tradeOpportunity = tradeService.recordInterest(
          currentListing.id,
          currentListing.user.id
        );

        if (tradeOpportunity) {
          // Trade Unlocked! Navigate to celebration screen
          router.push({
            pathname: '/trade-unlocked',
            params: {
              tradeId: tradeOpportunity.id,
              myItemId: tradeOpportunity.item1Id,
              theirItemId: tradeOpportunity.item2Id,
            },
          } as any);
        }
      }
      nextCard();
    });
  };

  // Keep swipeHandlerRef updated with current state values
  swipeHandlerRef.current = {
    onSwipeRight: () => {
      // If showing info card, just dismiss it on any swipe
      if (showInfoCard && currentIndex === 0) {
        Animated.timing(position, {
          toValue: { x: SCREEN_WIDTH + 100, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setDismissedInfoCard(true);
          setCurrentIndex(0);
          position.setValue({ x: 0, y: 0 });
        });
        return;
      }
      if (!isTradeItemLoaded) {
        resetPosition();
        return;
      }
      if (!selectedTradeItem) {
        setShowItemSelectionModal(true);
        resetPosition();
        return;
      }
      swipeRight();
    },
    onSwipeLeft: () => {
      // If showing info card, just dismiss it on any swipe
      if (showInfoCard && currentIndex === 0) {
        Animated.timing(position, {
          toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          setDismissedInfoCard(true);
          setCurrentIndex(0);
          position.setValue({ x: 0, y: 0 });
        });
        return;
      }
      if (!isTradeItemLoaded) {
        resetPosition();
        return;
      }
      if (!selectedTradeItem) {
        setShowItemSelectionModal(true);
        resetPosition();
        return;
      }
      swipeLeft();
    },
    onReset: resetPosition,
  };

  const nextCard = () => {
    position.setValue({ x: 0, y: 0 });
    // If we're at the info card, dismiss it and move to first real listing
    if (showInfoCard && currentIndex === 0) {
      setDismissedInfoCard(true);
      setCurrentIndex(0); // Start at first listing
    } else {
      const maxIndex = showInfoCard ? listings.length : listings.length - 1;
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
  };

  const handleSkip = () => {
    if (!isTradeItemLoaded) return;
    if (!selectedTradeItem) {
      setShowItemSelectionModal(true);
      return;
    }
    swipeLeft();
  };

  const handleTrade = () => {
    // Tapping the center button always opens the modal to view/change trade item
    setShowItemSelectionModal(true);
  };

  const handleWant = () => {
    if (!isTradeItemLoaded) return;
    if (!selectedTradeItem) {
      setShowItemSelectionModal(true);
      return;
    }
    swipeRight();
  };

  // Show true empty state only when we've gone through all listings
  const isAtEndOfListings = !showInfoCard && effectiveIndex >= listings.length;

  if (isAtEndOfListings && listings.length > 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="explore" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No more items to discover
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Check back later for new listings
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowLocationModal(true)}
        >
          <MaterialIcons name="location-on" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={cycleViewMode}
          activeOpacity={0.7}
        >
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="handshake" size={18} color={colors.textInverse} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Barter</Text>
          </View>
          <View style={styles.liveFeedBadge}>
            <View style={[styles.liveDot, { backgroundColor: viewMode === 'swipe' ? colors.primary : colors.textMuted }]} />
            <View style={[styles.liveDot, { backgroundColor: viewMode === 'grid' ? colors.primary : colors.textMuted, marginLeft: 4 }]} />
            <View style={[styles.liveDot, { backgroundColor: viewMode === 'map' ? colors.primary : colors.textMuted, marginLeft: 4 }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="tune" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Swipe View */}
      {viewMode === 'swipe' && (
        <>
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
          {/* Info Card - shown when no matching listings */}
          {showInfoCard && currentIndex === 0 ? (
            <>
              <View style={[styles.infoCardBackground, {
                backgroundColor: isDark ? colors.backgroundLight : '#FFFFFF',
                borderColor: colors.border,
              }]}>
                {/* Decorative shapes */}
                <View style={[styles.infoCardDecorCircle, { backgroundColor: `${colors.primary}15`, top: -30, right: -30 }]} />
                <View style={[styles.infoCardDecorCircle, { backgroundColor: `${colors.primary}10`, bottom: -40, left: -40, width: 120, height: 120 }]} />
              </View>
              <View style={styles.infoCardContent}>
                {/* Icon container with glow effect */}
                <View style={[styles.infoCardIconGlow, { backgroundColor: `${colors.primary}20` }]}>
                  <View style={[styles.infoCardIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <MaterialIcons name="explore" size={36} color={colors.primary} />
                  </View>
                </View>

                <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                  No items match your interests
                </Text>

                <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                  We couldn't find items in your selected categories, but don't worry! Swipe to explore all available items nearby.
                </Text>

                {/* Swipe hint with icons */}
                <View style={styles.infoCardSwipeHint}>
                  <View style={styles.infoCardSwipeIcons}>
                    <MaterialIcons name="chevron-left" size={20} color={colors.textMuted} />
                    <View style={[styles.infoCardSwipeLine, { backgroundColor: colors.border }]} />
                    <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.infoCardHint, { color: colors.textMuted }]}>
                    Swipe to dismiss and start browsing
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.infoCardButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/settings')}
                >
                  <MaterialIcons name="tune" size={18} color={isDark ? colors.background : '#FFFFFF'} />
                  <Text style={[styles.infoCardButtonText, { color: isDark ? colors.background : '#FFFFFF' }]}>
                    Update Interests
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : currentListing ? (
            <>
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
                    {getLocationText(currentListing.location, 'Brooklyn, 2.5 miles away')}
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
            </>
          ) : null}
        </Animated.View>

            {/* Blocked Overlay when no item selected */}
            {!selectedTradeItem && (
              <View style={styles.swipeBlockedOverlay}>
                <MaterialIcons name="swap-horiz" size={48} color={colors.primary} />
                <Text style={[styles.swipeBlockedText, { color: colors.textInverse }]}>
                  Select Your Trade Item
                </Text>
                <Text style={[styles.swipeBlockedSubtext, { color: 'rgba(255,255,255,0.7)' }]}>
                  Choose an item you want to offer before swiping
                </Text>
                <TouchableOpacity
                  style={[styles.selectItemButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowItemSelectionModal(true)}
                >
                  <Text style={[styles.selectItemButtonText, { color: colors.textInverse }]}>
                    Select Item
                  </Text>
                </TouchableOpacity>
              </View>
            )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <MaterialIcons name="close" size={28} color={Colors.error} />
          </TouchableOpacity>

          {/* Trade Button (Center) - Shows selected item or prompt */}
          <TouchableOpacity style={styles.tradeButton} onPress={handleTrade}>
            {selectedTradeItem ? (
              <Image
                source={{ uri: selectedTradeItem.images[0] || 'https://via.placeholder.com/40' }}
                style={styles.tradeButtonImage}
              />
            ) : (
              <MaterialIcons name="add" size={32} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Want/Like Button */}
          <TouchableOpacity style={styles.wantButton} onPress={handleWant}>
            <MaterialIcons name="check" size={28} color="#0A0A0A" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
          SWIPE LEFT TO SKIP  •  SWIPE RIGHT TO TRADE
        </Text>
      </View>
        </>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <View style={styles.gridContainer}>
          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search items nearby..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <View style={styles.categoryPillsRow}>
              {CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                    index > 0 && { marginLeft: 10 },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: colors.textSecondary },
                      selectedCategory === cat && { color: colors.textInverse },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Grid List */}
          <FlatList
            data={listings.filter(item =>
              (selectedCategory === 'All' || item.category === selectedCategory) &&
              (searchQuery === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
            )}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridList}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.gridItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => router.push(`/listing/${item.id}`)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.images[0] || 'https://via.placeholder.com/200' }}
                  style={styles.gridItemImage}
                  resizeMode="cover"
                />
                {/* Favorite Button */}
                <TouchableOpacity
                  style={[styles.favoriteButton, { backgroundColor: colors.surface + 'CC' }]}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <MaterialIcons
                    name={favorites.has(item.id) ? 'favorite' : 'favorite-border'}
                    size={18}
                    color={favorites.has(item.id) ? Colors.error : colors.textMuted}
                  />
                </TouchableOpacity>
                <View style={styles.gridItemContent}>
                  <Text style={[styles.gridItemTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.gridItemMeta}>
                    <View style={[styles.gridItemCategoryTag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.gridItemCategoryText, { color: colors.primary }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.gridItemLocation}>
                    <MaterialIcons name="location-on" size={12} color={colors.textMuted} />
                    <Text style={[styles.gridItemLocationText, { color: colors.textMuted }]} numberOfLines={1}>
                      {getLocationText(item.location)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyGrid}>
                <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyGridText, { color: colors.textMuted }]}>
                  No items found
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Map View - requires development build for full functionality */}
      {viewMode === 'map' && (
        <View style={styles.mapViewContainer}>
          {isExpoGo ? (
            /* Show dev build required message in Expo Go */
            <View style={styles.devBuildRequired}>
              <MaterialIcons name="map" size={64} color={colors.primary} />
              <Text style={[styles.devBuildTitle, { color: colors.text }]}>
                Interactive Map
              </Text>
              <Text style={[styles.devBuildText, { color: colors.textMuted }]}>
                The full map experience with item pins requires a development build.
                Create one with EAS Build to explore items on an interactive map.
              </Text>
              <TouchableOpacity
                style={[styles.devBuildButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={cycleViewMode}
              >
                <Text style={[styles.devBuildButtonText, { color: colors.text }]}>
                  Switch to Swipe View
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* TODO: Full react-native-maps implementation for dev builds */
            /* This will be implemented when creating the development build */
            <View style={styles.devBuildRequired}>
              <MaterialIcons name="map" size={64} color={colors.primary} />
              <Text style={[styles.devBuildTitle, { color: colors.text }]}>
                Map View Coming Soon
              </Text>
              <Text style={[styles.devBuildText, { color: colors.textMuted }]}>
                The interactive map with item pins will be available in the next update.
              </Text>
              <TouchableOpacity
                style={[styles.devBuildButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={cycleViewMode}
              >
                <Text style={[styles.devBuildButtonText, { color: colors.text }]}>
                  Switch to Swipe View
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, backgroundColor: colors.backgroundLight }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Location</Text>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.surface }]}
                onPress={() => setShowLocationModal(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Current Location */}
            <View style={[styles.currentLocationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.locationIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <MaterialIcons name="my-location" size={24} color={colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Current Location</Text>
                <Text style={[styles.locationValue, { color: colors.text }]}>{currentLocation}</Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color={colors.primary} />
            </View>

            {/* Map Section */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>Tap to Set Location</Text>
              <View
                style={[styles.mapContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                {/* Satellite Map Background */}
                <Image
                  source={{ uri: 'https://mt1.google.com/vt/lyrs=s&x=603&y=769&z=11' }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />

                {/* Touchable area for pin placement */}
                <TouchableOpacity
                  style={styles.mapTouchArea}
                  activeOpacity={1}
                  onPress={(e) => {
                    const { locationX, locationY } = e.nativeEvent;
                    const newX = Math.max(0.05, Math.min(0.95, locationX / 300));
                    const newY = Math.max(0.05, Math.min(0.95, locationY / 200));
                    setPinPosition({ x: newX, y: newY });
                  }}
                >
                  {/* Pin Marker */}
                  <View
                    style={[
                      styles.mapPin,
                      {
                        left: `${pinPosition.x * 100}%`,
                        top: `${pinPosition.y * 100}%`,
                      },
                    ]}
                  >
                    <View style={[styles.customMarker, { backgroundColor: colors.primary }]}>
                      <MaterialIcons name="location-on" size={24} color={colors.textInverse} />
                    </View>
                    <View style={[styles.pinShadow, { backgroundColor: colors.primary + '40' }]} />
                  </View>
                </TouchableOpacity>

                {/* Map Hint */}
                <View style={[styles.mapHint, { backgroundColor: colors.surface + 'E6' }]}>
                  <MaterialIcons name="touch-app" size={16} color={colors.textMuted} />
                  <Text style={[styles.mapHintText, { color: colors.textMuted }]}>
                    Tap to move pin
                  </Text>
                </View>
              </View>
            </View>

            {/* Popular Locations */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>Popular Locations</Text>
              <View style={styles.popularLocations}>
                {['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL', 'Austin, TX'].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locationChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      currentLocation === loc && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setCurrentLocation(loc)}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color={currentLocation === loc ? colors.textInverse : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.locationChipText,
                        { color: colors.textSecondary },
                        currentLocation === loc && { color: colors.textInverse },
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={[styles.applyButtonText, { color: colors.textInverse }]}>Update Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          // Only allow closing if an item is selected
          if (selectedTradeItem) {
            setShowItemSelectionModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, backgroundColor: colors.backgroundLight }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedTradeItem ? 'Your Trade Item' : 'Select Your Item'}
              </Text>
              {selectedTradeItem && (
                <TouchableOpacity
                  style={[styles.modalClose, { backgroundColor: colors.surface }]}
                  onPress={() => setShowItemSelectionModal(false)}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Info Text */}
            <View style={[styles.selectionInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="info-outline" size={20} color={colors.primary} />
              <Text style={[styles.selectionInfoText, { color: colors.textSecondary }]}>
                {selectedTradeItem
                  ? 'This is the item others will see when you match. Tap below to change it.'
                  : 'Choose an item you want to trade. Others will see this when you swipe right on their items.'}
              </Text>
            </View>

            {/* Currently Selected Item */}
            {selectedTradeItem && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>CURRENTLY SELECTED</Text>
                <View style={[styles.selectedTradeItemCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                  <Image
                    source={{ uri: selectedTradeItem.images[0] || 'https://via.placeholder.com/80' }}
                    style={styles.selectedTradeItemImage}
                  />
                  <View style={styles.selectedTradeItemInfo}>
                    <Text style={[styles.selectedTradeItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {selectedTradeItem.title}
                    </Text>
                    <Text style={[styles.selectedTradeItemValue, { color: colors.primary }]}>
                      ~${selectedTradeItem.estimatedValue}
                    </Text>
                  </View>
                  <View style={[styles.selectedCheckmark, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="check" size={16} color={colors.textInverse} />
                  </View>
                </View>
              </View>
            )}

            {/* Your Items List */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.textMuted }]}>
                {selectedTradeItem ? 'CHANGE TO' : 'YOUR ITEMS'}
              </Text>
              <ScrollView style={styles.itemSelectionList} showsVerticalScrollIndicator={false}>
                {userListings.map((item) => {
                  const isSelected = selectedTradeItem?.id === item.id;
                  if (isSelected) return null; // Don't show selected item in the list below
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemSelectionRow,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                      onPress={() => {
                        setSelectedTradeItem(item);
                        setShowItemSelectionModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: item.images[0] || 'https://via.placeholder.com/60' }}
                        style={styles.itemSelectionImage}
                      />
                      <View style={styles.itemSelectionInfo}>
                        <Text style={[styles.itemSelectionTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemSelectionValue, { color: colors.textMuted }]}>
                          ~${item.estimatedValue}
                        </Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Add New Item Button */}
            <TouchableOpacity
              style={[styles.addNewItemButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setShowItemSelectionModal(false);
                router.push('/create');
              }}
            >
              <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.addNewItemText, { color: colors.primary }]}>List a New Item</Text>
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
  headerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
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
    backgroundColor: Colors.primary,
  },
  liveFeedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
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
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wantStampText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.primary,
  },
  skipStamp: {
    position: 'absolute',
    top: 40,
    left: 40,
    transform: [{ rotate: '-12deg' }],
    borderWidth: 4,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipStampText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.error,
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
    color: Colors.primary,
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
    overflow: 'hidden',
  },
  tradeButtonImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  wantButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyActionButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  emptyActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Info Card styles (for no matching interests)
  infoCardBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  infoCardDecorCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  infoCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  infoCardIconGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoCardIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  infoCardText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  infoCardSwipeHint: {
    alignItems: 'center',
    marginBottom: 28,
  },
  infoCardSwipeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardSwipeLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 8,
  },
  infoCardDivider: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 20,
  },
  infoCardHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  infoCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    shadowColor: '#19E680',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCardButtonText: {
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchLocationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  popularLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mapGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  mapTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    position: 'absolute',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    marginTop: -4,
  },
  mapHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  mapHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Grid View Styles
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  categoryScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridList: {
    paddingBottom: 120,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gridItemImage: {
    width: '100%',
    aspectRatio: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemContent: {
    padding: 12,
  },
  gridItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  gridItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridItemCategoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridItemCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gridItemLocationText: {
    fontSize: 12,
    flex: 1,
  },
  emptyGrid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyGridText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Map View Styles
  mapViewContainer: {
    flex: 1,
    position: 'relative',
  },
  exploreMapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  exploreMapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  currentLocationMarker: {
    position: 'absolute',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  currentLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.3,
  },
  itemMarker: {
    position: 'absolute',
    marginLeft: -24,
    marginTop: -24,
    zIndex: 1,
  },
  itemMarkerSelected: {
    zIndex: 10,
  },
  mapMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  itemMarkerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  itemMarkerArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLocationBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLocationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedItemCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedItemCardInner: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  selectedItemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  selectedItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  selectedItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  selectedItemCategoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedItemCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedItemLocationText: {
    fontSize: 13,
  },
  selectedItemActions: {
    gap: 8,
  },
  selectedItemAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSelectedItem: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsCountBadge: {
    position: 'absolute',
    bottom: 116,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemsCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Item Selection Modal Styles
  selectionInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  selectionInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  selectedTradeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  selectedTradeItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  selectedTradeItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedTradeItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedTradeItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelectionList: {
    maxHeight: 200,
  },
  itemSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemSelectionImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  itemSelectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemSelectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSelectionValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  addNewItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  addNewItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  swipeBlockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    zIndex: 100,
  },
  swipeBlockedText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  swipeBlockedSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectItemButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  selectItemButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Map View Styles
  mapNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mapNoticeText: {
    flex: 1,
    fontSize: 13,
  },
  mapListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  mapListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  mapListHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  mapListItemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  mapListItemInfo: {
    flex: 1,
    gap: 4,
  },
  mapListItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  mapListItemCategoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapListItemCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mapListItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapListItemLocation: {
    fontSize: 12,
  },
  devBuildRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  devBuildTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  devBuildText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  devBuildButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  devBuildButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
