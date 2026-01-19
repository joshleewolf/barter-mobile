import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { MOCK_LISTINGS } from '../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_WIDTH - 80) / 2;

export default function TradeUnlockedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    tradeId: string;
    myItemId: string;
    theirItemId: string;
  }>();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const leftCardAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const rightCardAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const handshakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get item data
  const myItem = MOCK_LISTINGS.find(l => l.id === params.myItemId) || MOCK_LISTINGS[0];
  const theirItem = MOCK_LISTINGS.find(l => l.id === params.theirItemId) || MOCK_LISTINGS[1];

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // Cards slide in
      Animated.parallel([
        Animated.spring(leftCardAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(rightCardAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Handshake icon appears
      Animated.spring(handshakeAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      // Title appears
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for handshake
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleStartNegotiating = () => {
    // Navigate to chat with the trade context
    router.replace('/chat/new' as any);
  };

  const handleKeepBrowsing = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Background pattern */}
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternDot,
              {
                left: `${(i % 5) * 25}%`,
                top: `${Math.floor(i / 5) * 25}%`,
                opacity: 0.1,
              },
            ]}
          />
        ))}
      </View>

      {/* Main content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          <Text style={styles.subtitle}>Mutual Interest Detected</Text>
          <Text style={styles.title}>Sealed the Deal!</Text>
        </Animated.View>

        {/* Cards with handshake */}
        <View style={styles.cardsContainer}>
          {/* Your Item Card */}
          <Animated.View
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.cardBg,
                transform: [
                  { translateX: leftCardAnim },
                  { rotate: '-8deg' },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: myItem.images?.[0] || 'https://via.placeholder.com/200' }}
              style={styles.itemImage}
            />
            <View style={styles.itemLabel}>
              <Text style={[styles.itemLabelText, { color: colors.text }]}>Your Item</Text>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                {myItem.title}
              </Text>
            </View>
          </Animated.View>

          {/* Handshake Icon */}
          <Animated.View
            style={[
              styles.handshakeContainer,
              {
                transform: [
                  { scale: Animated.multiply(handshakeAnim, pulseAnim) },
                ],
                opacity: handshakeAnim,
              },
            ]}
          >
            <View style={[styles.handshakeCircle, { backgroundColor: colors.background }]}>
              <MaterialIcons name="handshake" size={32} color={colors.primary} />
            </View>
          </Animated.View>

          {/* Their Item Card */}
          <Animated.View
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.cardBg,
                transform: [
                  { translateX: rightCardAnim },
                  { rotate: '8deg' },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: theirItem.images?.[0] || 'https://via.placeholder.com/200' }}
              style={styles.itemImage}
            />
            <View style={styles.itemLabel}>
              <Text style={[styles.itemLabelText, { color: colors.text }]}>Their Item</Text>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                {theirItem.title}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Description */}
        <Animated.Text
          style={[
            styles.description,
            {
              opacity: scaleAnim,
            },
          ]}
        >
          Both of you are interested in trading! Start negotiating to make a deal.
        </Animated.Text>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              paddingBottom: insets.bottom + 24,
              opacity: scaleAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.background }]}
            onPress={handleStartNegotiating}
            activeOpacity={0.8}
          >
            <MaterialIcons name="chat" size={24} color={colors.primary} />
            <Text style={[styles.primaryButtonText, { color: colors.primary }]}>
              Start Negotiating
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleKeepBrowsing}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Keep Browsing</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternDot: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  itemCard: {
    width: CARD_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  itemImage: {
    width: '100%',
    height: CARD_SIZE,
  },
  itemLabel: {
    padding: 12,
  },
  itemLabelText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  handshakeContainer: {
    marginHorizontal: -20,
    zIndex: 10,
  },
  handshakeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});
