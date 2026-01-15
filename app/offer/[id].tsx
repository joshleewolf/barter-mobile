import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_LISTINGS, generateCashSuggestion } from '../../services/mockData';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Listing {
  id: string;
  title: string;
  description: string;
  estimatedValue: number;
  images: string[];
  user: {
    id: string;
    displayName: string;
    rating: number;
  };
}

interface CashSuggestion {
  suggestedAmount: number;
  minAmount: number;
  maxAmount: number;
  confidence: number;
}

export default function OfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<Listing | null>(null);
  const [suggestion, setSuggestion] = useState<CashSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);

  // Slider animation
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const sliderWidth = SCREEN_WIDTH - 80; // Account for padding

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (suggestion) {
      const percentage = (cashAmount - suggestion.minAmount) / (suggestion.maxAmount - suggestion.minAmount);
      Animated.spring(sliderPosition, {
        toValue: percentage * sliderWidth,
        useNativeDriver: false,
        tension: 100,
        friction: 12,
      }).start();
    }
  }, [cashAmount, suggestion]);

  const loadData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const listingData = MOCK_LISTINGS.find(l => l.id === id);
    if (listingData) {
      setListing(listingData as unknown as Listing);
      const suggestionData = generateCashSuggestion(listingData);
      setSuggestion(suggestionData);
      setCashAmount(suggestionData.suggestedAmount);
    }

    setLoading(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!suggestion) return;

        const newPosition = Math.max(0, Math.min(sliderWidth, gestureState.moveX - 40));
        const percentage = newPosition / sliderWidth;
        const newAmount = Math.round(
          suggestion.minAmount + percentage * (suggestion.maxAmount - suggestion.minAmount)
        );
        setCashAmount(newAmount);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const handleSubmitOffer = async () => {
    if (cashAmount <= 0) {
      Alert.alert('Error', 'Please select a cash amount');
      return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitting(false);

    Alert.alert('Success!', 'Your offer has been sent', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const quickAmounts = suggestion ? [
    { label: '+$10', value: suggestion.minAmount + 10 },
    { label: `+$${suggestion.suggestedAmount}`, value: suggestion.suggestedAmount, isAI: true },
    { label: '+$100', value: Math.min(suggestion.suggestedAmount + 55, suggestion.maxAmount) },
    { label: 'Max', value: suggestion.maxAmount },
  ] : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!listing || !suggestion) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load listing</Text>
      </View>
    );
  }

  // Calculate slider tick positions
  const tickCount = 20;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const position = (i / (tickCount - 1)) * 100;
    const isCenter = i === Math.floor(tickCount / 2);
    return { position, isCenter };
  });

  return (
    <View style={styles.container}>
      {/* Background Image with Blur */}
      <Image
        source={{ uri: listing.images[0] || 'https://via.placeholder.com/400' }}
        style={styles.backgroundImage}
        blurRadius={50}
      />
      {/* Gradient Overlay for smooth transition */}
      <LinearGradient
        colors={[
          'rgba(17, 33, 25, 0.4)',
          'rgba(17, 33, 25, 0.7)',
          'rgba(17, 33, 25, 0.9)',
          'rgba(17, 33, 25, 0.95)',
        ]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make an Offer</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Target Item Card */}
        <View style={styles.targetCard}>
          <BlurView intensity={40} tint="dark" style={styles.targetCardBlur}>
            <View style={styles.targetCardContent}>
              <Image
                source={{ uri: listing.images[0] || 'https://via.placeholder.com/60' }}
                style={styles.targetImage}
              />
              <View style={styles.targetInfo}>
                <Text style={styles.targetLabel}>Trading for</Text>
                <Text style={styles.targetTitle} numberOfLines={1}>
                  {listing.title}
                </Text>
                <Text style={styles.targetValue}>
                  Listed at ${listing.estimatedValue}
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* AI Recommended Badge */}
        <View style={styles.aiBadgeContainer}>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeIcon}>✦</Text>
            <Text style={styles.aiBadgeText}>AI RECOMMENDED</Text>
          </View>
        </View>

        {/* Cash Amount Display */}
        <View style={styles.cashDisplayContainer}>
          <View style={styles.cashDisplay}>
            <Text style={styles.cashAmount}>+${cashAmount}.00</Text>
          </View>
          <Text style={styles.cashSubtext}>Added to your trade item</Text>
        </View>

        {/* Slider Track with Ticks */}
        <View style={styles.sliderSection} {...panResponder.panHandlers}>
          <View style={styles.sliderTrackContainer}>
            {/* Tick marks */}
            <View style={styles.ticksContainer}>
              {ticks.map((tick, index) => (
                <View
                  key={index}
                  style={[
                    styles.tick,
                    tick.isCenter && styles.tickCenter,
                    { left: `${tick.position}%` },
                  ]}
                />
              ))}
            </View>

            {/* Slider track */}
            <View style={styles.sliderTrack}>
              <Animated.View
                style={[
                  styles.sliderFill,
                  { width: sliderPosition },
                ]}
              />
            </View>

            {/* Slider handle */}
            <Animated.View
              style={[
                styles.sliderHandle,
                { transform: [{ translateX: sliderPosition }] },
              ]}
            >
              <View style={styles.sliderHandleInner}>
                <View style={styles.sliderHandleLine} />
                <View style={styles.sliderHandleLine} />
              </View>
            </Animated.View>
          </View>

          {/* Min/Max labels */}
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelMin}>${suggestion.minAmount}</Text>
            <Text style={styles.sliderLabelMax}>${suggestion.maxAmount}</Text>
          </View>
        </View>

        {/* Quick Selection Chips */}
        <View style={styles.quickChips}>
          {quickAmounts.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickChip,
                item.isAI && styles.quickChipAI,
                cashAmount === item.value && styles.quickChipActive,
              ]}
              onPress={() => setCashAmount(item.value)}
            >
              {item.isAI && <Text style={styles.quickChipAIIcon}>✦</Text>}
              <Text
                style={[
                  styles.quickChipText,
                  item.isAI && styles.quickChipTextAI,
                  cashAmount === item.value && styles.quickChipTextActive,
                ]}
              >
                {item.label}
                {item.isAI && ' (AI)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Panel */}
      <LinearGradient
        colors={['transparent', 'rgba(17, 33, 25, 0.95)', '#112119']}
        style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.bottomPanelContent}>
          {/* Total Value Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Your total value:</Text>
            <Text style={styles.totalValue}>${(listing.estimatedValue + cashAmount).toLocaleString()}.00</Text>
          </View>

          {/* Send Offer Button */}
          <TouchableOpacity
            style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
            onPress={handleSubmitOffer}
            disabled={submitting}
          >
            <Text style={styles.sendButtonText}>
              {submitting ? 'Sending...' : 'Send Offer'}
            </Text>
            <Text style={styles.sendButtonArrow}>≫</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={styles.disclaimerText}>SUBJECT TO RECIPIENT APPROVAL</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: Spacing.lg,
    paddingBottom: 200,
  },
  targetCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  targetCardBlur: {
    padding: Spacing.md,
  },
  targetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  targetInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  targetLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  targetTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  targetValue: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  aiBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(25, 230, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 128, 0.3)',
  },
  aiBadgeIcon: {
    fontSize: 14,
    color: '#19e680',
    marginRight: 8,
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#19e680',
    letterSpacing: 1.5,
  },
  cashDisplayContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cashDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cashAmount: {
    fontSize: 64,
    fontWeight: '800',
    color: '#19e680',
    letterSpacing: -2,
  },
  cashSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  sliderSection: {
    marginBottom: Spacing.xl,
  },
  sliderTrackContainer: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
  },
  ticksContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
    top: 9,
  },
  tickCenter: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: 5,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sliderHandle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    marginLeft: -16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderHandleInner: {
    flexDirection: 'row',
    gap: 3,
  },
  sliderHandleLine: {
    width: 2,
    height: 12,
    backgroundColor: Colors.textMuted,
    borderRadius: 1,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sliderLabelMin: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  sliderLabelMax: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  quickChipAI: {
    backgroundColor: 'rgba(25, 230, 128, 0.15)',
    borderColor: 'rgba(25, 230, 128, 0.4)',
  },
  quickChipActive: {
    backgroundColor: '#19e680',
    borderColor: '#19e680',
  },
  quickChipAIIcon: {
    fontSize: 12,
    color: '#19e680',
    marginRight: 6,
  },
  quickChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickChipTextAI: {
    color: '#19e680',
  },
  quickChipTextActive: {
    color: '#0A0A0A',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
  },
  bottomPanelContent: {
    paddingHorizontal: 24,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#19e680',
    borderRadius: 9999,
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#19e680',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
    marginRight: 8,
  },
  sendButtonArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    marginTop: 16,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.error,
  },
});
