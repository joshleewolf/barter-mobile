/**
 * Map Screen
 *
 * Shows nearby listings on a map with satellite view option.
 * Requires a development build to use react-native-maps.
 * Shows a fallback UI when running in Expo Go.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useTheme } from '../hooks/useTheme';
import { MOCK_LISTINGS } from '../services/mockData';

interface ListingLocation {
  id: string;
  title: string;
  estimatedValue: number;
  images: string[];
  category: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  user: {
    displayName: string;
    rating: number;
  };
}

// Check if we're in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingLocation | null>(null);

  // Filter listings that have location data
  const listingsWithLocation = MOCK_LISTINGS.filter(
    (listing): listing is ListingLocation => !!listing.location
  );

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission',
            'Location permission is needed to show nearby items.'
          );
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Calculate distance between two points (in miles)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Sort listings by distance from user
  const sortedListings = userLocation
    ? [...listingsWithLocation].sort((a, b) => {
        const distA = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distB = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distA - distB;
      })
    : listingsWithLocation;

  const getDistanceText = (listing: ListingLocation) => {
    if (!userLocation) return listing.location.name;
    const dist = calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      listing.location.latitude,
      listing.location.longitude
    );
    return `${dist.toFixed(1)} mi away`;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  // Fallback UI for Expo Go (list view instead of map)
  if (isExpoGo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Items</Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Expo Go Notice */}
        <View style={[styles.expoGoNotice, { backgroundColor: colors.warning + '20' }]}>
          <MaterialIcons name="info-outline" size={20} color={colors.warning} />
          <Text style={[styles.expoGoNoticeText, { color: colors.text }]}>
            Full map requires a development build. Showing list view.
          </Text>
        </View>

        {/* List of nearby items */}
        <FlatList
          data={sortedListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.listItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/listing/${item.id}`)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.images[0] }} style={styles.listItemImage} />
              <View style={styles.listItemInfo}>
                <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.listItemValue, { color: colors.primary }]}>
                  ${item.estimatedValue.toLocaleString()}
                </Text>
                <View style={styles.listItemMeta}>
                  <MaterialIcons name="place" size={14} color={colors.textMuted} />
                  <Text style={[styles.listItemLocation, { color: colors.textMuted }]}>
                    {getDistanceText(item)}
                  </Text>
                </View>
                <View style={styles.listItemMeta}>
                  <MaterialIcons name="star" size={14} color={colors.warning} />
                  <Text style={[styles.listItemRating, { color: colors.textSecondary }]}>
                    {item.user.rating} • {item.user.displayName}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="inventory-2" size={18} color={colors.primary} />
              <Text style={[styles.listHeaderText, { color: colors.text }]}>
                {sortedListings.length} items nearby
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // This code path requires a development build with react-native-maps
  // For now, show the same fallback
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Nearby Items</Text>

        <View style={{ width: 44 }} />
      </View>

      {/* List of nearby items */}
      <FlatList
        data={sortedListings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/listing/${item.id}`)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.images[0] }} style={styles.listItemImage} />
            <View style={styles.listItemInfo}>
              <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.listItemValue, { color: colors.primary }]}>
                ${item.estimatedValue.toLocaleString()}
              </Text>
              <View style={styles.listItemMeta}>
                <MaterialIcons name="place" size={14} color={colors.textMuted} />
                <Text style={[styles.listItemLocation, { color: colors.textMuted }]}>
                  {getDistanceText(item)}
                </Text>
              </View>
              <View style={styles.listItemMeta}>
                <MaterialIcons name="star" size={14} color={colors.warning} />
                <Text style={[styles.listItemRating, { color: colors.textSecondary }]}>
                  {item.user.rating} • {item.user.displayName}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <MaterialIcons name="inventory-2" size={18} color={colors.primary} />
            <Text style={[styles.listHeaderText, { color: colors.text }]}>
              {sortedListings.length} items nearby
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  expoGoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  expoGoNoticeText: {
    flex: 1,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  listItemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  listItemInfo: {
    flex: 1,
    gap: 3,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemLocation: {
    fontSize: 12,
  },
  listItemRating: {
    fontSize: 12,
  },
});
