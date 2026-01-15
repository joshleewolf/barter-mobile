import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_LISTINGS } from '../../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Listing {
  id: string;
  title: string;
  description: string;
  type: 'ITEM' | 'SERVICE';
  condition?: string;
  estimatedValue: number;
  images: string[];
  category: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
    totalTrades: number;
    createdAt: string;
  };
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const found = MOCK_LISTINGS.find(l => l.id === id);
    setListing(found as unknown as Listing || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#19e680" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Listing not found</Text>
      </View>
    );
  }

  const tradeInterests = [
    { icon: 'devices', label: 'Tech Gadgets', primary: true },
    { icon: 'brush', label: 'Graphic Design', primary: true },
    { icon: 'headphones', label: 'Audio Gear', primary: false },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${listing.title}" on Barter! Listed at $${listing.estimatedValue}`,
        title: listing.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share this listing');
    }
  };

  const handleViewProfile = () => {
    Alert.alert(
      listing.user.displayName,
      `Rating: ${listing.user.rating.toFixed(1)}/5.0\nTrades: ${listing.user.totalTrades}\n\nMember since ${new Date(listing.user.createdAt).getFullYear()}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery with Gradient */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          >
            {listing.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: uri || 'https://via.placeholder.com/400' }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(10,10,10,1)']}
                  locations={[0, 0.2, 1]}
                  style={styles.imageGradient}
                />
              </View>
            ))}
          </ScrollView>

          {/* Header buttons - floating */}
          <View style={[styles.headerButtons, { top: insets.top + 16 }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <MaterialIcons name="share" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image indicators */}
          {listing.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#19e680" />
              <Text style={styles.verifiedBadgeText}>VERIFIED TRADER</Text>
            </View>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>
                {listing.condition?.replace('_', ' ').toUpperCase() || 'MINT CONDITION'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Seller Profile Card */}
          <TouchableOpacity style={styles.sellerCard} onPress={handleViewProfile}>
            <View style={styles.sellerLeft}>
              <Image
                source={{ uri: listing.user.avatar || 'https://via.placeholder.com/48' }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing.user.displayName}</Text>
                <View style={styles.sellerRating}>
                  <MaterialIcons name="star" size={16} color="#19e680" />
                  <Text style={styles.sellerRatingText}>
                    {listing.user.rating.toFixed(1)} ({listing.user.totalTrades} reviews)
                  </Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Trade Interests */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="swap-horiz" size={20} color="#19e680" />
              <Text style={styles.sectionTitle}>Trade Interests</Text>
            </View>
            <View style={styles.interestsRow}>
              {tradeInterests.map((interest, index) => (
                <View
                  key={index}
                  style={[
                    styles.interestChip,
                    interest.primary ? styles.interestChipPrimary : styles.interestChipSecondary
                  ]}
                >
                  <MaterialIcons
                    name={interest.icon as any}
                    size={18}
                    color={interest.primary ? '#19e680' : 'rgba(255,255,255,0.6)'}
                  />
                  <Text style={[
                    styles.interestChipText,
                    interest.primary ? styles.interestChipTextPrimary : styles.interestChipTextSecondary
                  ]}>
                    {interest.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Trader Rating Card */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingTitle}>Trader Rating</Text>
              <Text style={styles.ratingValue}>{listing.user.rating.toFixed(1)}/5.0</Text>
            </View>
            <View style={styles.ratingBars}>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>5</Text>
                <View style={styles.ratingBarBg}>
                  <View style={[styles.ratingBarFill, { width: '90%' }]} />
                </View>
                <Text style={styles.ratingPercent}>90%</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>4</Text>
                <View style={styles.ratingBarBg}>
                  <View style={[styles.ratingBarFill, { width: '8%' }]} />
                </View>
                <Text style={styles.ratingPercent}>8%</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <LinearGradient
        colors={['transparent', '#0A0A0A', '#0A0A0A']}
        style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color="#fff" />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={() => router.push(`/offer/${listing.id}` as any)}
          >
            <MaterialIcons name="handshake" size={24} color="#0A0A0A" />
            <Text style={styles.offerButtonText}>Make Offer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 5,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerButtons: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#19e680',
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -16,
    position: 'relative',
    zIndex: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(25, 230, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#19e680',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  conditionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(25, 230, 128, 0.2)',
  },
  sellerInfo: {},
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sellerRatingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
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
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  interestChipPrimary: {
    backgroundColor: 'rgba(25, 230, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 128, 0.2)',
  },
  interestChipSecondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  interestChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  interestChipTextPrimary: {
    color: '#19e680',
  },
  interestChipTextSecondary: {
    color: 'rgba(255,255,255,0.8)',
  },
  ratingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#19e680',
  },
  ratingBars: {
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    width: 20,
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#19e680',
    borderRadius: 3,
  },
  ratingPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    width: 40,
    textAlign: 'right',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    height: 64,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  offerButton: {
    flex: 2,
    height: 64,
    borderRadius: 9999,
    backgroundColor: '#19e680',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#19e680',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  offerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
});
