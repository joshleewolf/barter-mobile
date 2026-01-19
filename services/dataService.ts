/**
 * Data Service - Abstraction layer for API/Mock data
 *
 * This service provides a unified interface for fetching data that can
 * transparently switch between mock data (for development) and Supabase
 * (for production).
 */

import { config } from '../constants/config';
import { supabase, type Database } from './supabase';
import {
  MOCK_LISTINGS,
  MOCK_USER_LISTINGS,
  MOCK_CONVERSATIONS,
  MOCK_OFFERS,
} from './mockData';

// Database row types
type ListingRow = Database['public']['Tables']['listings']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OfferRow = Database['public']['Tables']['offers']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

// Types
export interface Listing {
  id: string;
  title: string;
  description: string;
  images: string[];
  estimatedValue: number;
  category: string;
  condition?: string;
  type: 'ITEM' | 'SERVICE';
  location?: string;
  distance?: string;
  userId: string;
  user?: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    rating?: number;
  };
  createdAt: string;
  status: string;
}

export interface UserListing {
  id: string;
  title: string;
  images: string[];
  estimatedValue: number;
  status: string;
}

export interface Conversation {
  id: string;
  offerId: string;
  otherUser: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  listing: {
    id: string;
    title: string;
    images: string[];
  };
  status: string;
}

export interface Offer {
  id: string;
  status: string;
  type: 'SENT' | 'RECEIVED';
  listing: {
    id: string;
    title: string;
    images: string[];
    estimatedValue?: number;
  };
  offeredItem?: {
    id?: string;
    title: string;
    images: string[];
    estimatedValue?: number;
  };
  cashAmount?: number;
  createdAt: string;
  otherUser: {
    id: string;
    displayName: string;
    avatar?: string;
    rating?: number;
  };
}

// Configuration
const USE_MOCK_DATA = config.isDevelopment;

// Helper to transform Supabase listing row to our Listing type
function transformListing(
  row: ListingRow & { profiles?: ProfileRow | null }
): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    images: row.images,
    estimatedValue: row.estimated_value,
    category: row.category,
    condition: row.condition || undefined,
    type: row.type as 'ITEM' | 'SERVICE',
    location: row.location || undefined,
    userId: row.user_id,
    user: row.profiles ? {
      id: row.profiles.id,
      displayName: row.profiles.display_name,
      username: row.profiles.username,
      avatar: row.profiles.avatar_url || undefined,
      rating: row.profiles.rating,
    } : undefined,
    createdAt: row.created_at,
    status: row.status,
  };
}

// Data fetching functions
export const dataService = {
  /**
   * Get discovery feed listings
   */
  async getDiscoveryFeed(params?: {
    category?: string;
    distance?: string;
    minValue?: number;
    maxValue?: number;
  }): Promise<Listing[]> {
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await delay(300);

      // Map mock data to Listing type
      let listings: Listing[] = MOCK_LISTINGS.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        images: l.images,
        estimatedValue: l.estimatedValue,
        category: l.category,
        condition: l.condition || undefined,
        type: l.type as 'ITEM' | 'SERVICE',
        userId: l.user.id,
        user: {
          id: l.user.id,
          displayName: l.user.displayName,
          username: l.user.username,
          avatar: l.user.avatar || undefined,
          rating: l.user.rating,
        },
        createdAt: l.createdAt,
        status: 'ACTIVE',
      }));

      // Apply filters
      if (params?.category && params.category !== 'All') {
        listings = listings.filter((l) => l.category === params.category);
      }

      return listings;
    }

    // Get current user to exclude their own listings
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles (*)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    // Exclude current user's listings
    if (user) {
      query = query.neq('user_id', user.id);
    }

    // Apply category filter
    if (params?.category && params.category !== 'All') {
      query = query.eq('category', params.category);
    }

    // Apply value filters
    if (params?.minValue !== undefined) {
      query = query.gte('estimated_value', params.minValue);
    }
    if (params?.maxValue !== undefined) {
      query = query.lte('estimated_value', params.maxValue);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching discovery feed:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => transformListing(row as ListingRow & { profiles: ProfileRow }));
  },

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<Listing | null> {
    if (USE_MOCK_DATA) {
      await delay(200);
      const found = MOCK_LISTINGS.find((l) => l.id === id);
      if (!found) return null;

      return {
        id: found.id,
        title: found.title,
        description: found.description,
        images: found.images,
        estimatedValue: found.estimatedValue,
        category: found.category,
        condition: found.condition || undefined,
        type: found.type as 'ITEM' | 'SERVICE',
        userId: found.user.id,
        user: {
          id: found.user.id,
          displayName: found.user.displayName,
          username: found.user.username,
          avatar: found.user.avatar || undefined,
          rating: found.user.rating,
        },
        createdAt: found.createdAt,
        status: 'ACTIVE',
      };
    }

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return null;
    }

    return transformListing(data as ListingRow & { profiles: ProfileRow });
  },

  /**
   * Get current user's listings
   */
  async getMyListings(): Promise<UserListing[]> {
    if (USE_MOCK_DATA) {
      await delay(200);
      return MOCK_USER_LISTINGS as UserListing[];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('listings')
      .select('id, title, images, estimated_value, status')
      .eq('user_id', user.id)
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false })
      .returns<Pick<ListingRow, 'id' | 'title' | 'images' | 'estimated_value' | 'status'>[]>();

    if (error) {
      console.error('Error fetching my listings:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      images: row.images,
      estimatedValue: row.estimated_value,
      status: row.status,
    }));
  },

  /**
   * Get user's conversations
   */
  async getConversations(): Promise<Conversation[]> {
    if (USE_MOCK_DATA) {
      await delay(300);
      // Map mock data to Conversation type
      return MOCK_CONVERSATIONS.map((c) => ({
        id: c.id,
        offerId: c.id, // Use conversation id as offer id for mock
        otherUser: {
          id: c.id,
          displayName: c.otherParticipant.displayName,
          avatar: c.otherParticipant.avatar || undefined,
        },
        lastMessage: c.lastMessage ? {
          content: c.lastMessage.content,
          createdAt: c.lastMessage.createdAt,
          isRead: c.unreadCount === 0,
        } : undefined,
        listing: {
          id: c.id,
          title: c.offer.listing.title,
          images: c.offer.listing.images,
        },
        status: 'ACTIVE',
      }));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get offers where user is involved
    type OfferWithListing = {
      id: string;
      status: string;
      from_user_id: string;
      to_user_id: string;
      listing_id: string;
      listings: { id: string; title: string; images: string[] } | null;
    };

    const { data: offers, error } = await supabase
      .from('offers')
      .select(`
        id,
        status,
        from_user_id,
        to_user_id,
        listing_id,
        listings!offers_listing_id_fkey (
          id,
          title,
          images
        )
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .returns<OfferWithListing[]>();

    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error(error.message);
    }

    // Get the other user's profile and last message for each offer
    const conversations: Conversation[] = [];

    for (const offer of offers || []) {
      const otherUserId = offer.from_user_id === user.id ? offer.to_user_id : offer.from_user_id;

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', otherUserId)
        .single<Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'>>();

      // Get last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, is_read')
        .eq('offer_id', offer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single<Pick<MessageRow, 'content' | 'created_at' | 'is_read'>>();

      const listing = offer.listings;

      conversations.push({
        id: offer.id,
        offerId: offer.id,
        otherUser: {
          id: otherUserId,
          displayName: profile?.display_name || 'Unknown',
          avatar: profile?.avatar_url || undefined,
        },
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.created_at,
          isRead: lastMsg.is_read,
        } : undefined,
        listing: {
          id: listing?.id || '',
          title: listing?.title || '',
          images: listing?.images || [],
        },
        status: offer.status,
      });
    }

    return conversations;
  },

  /**
   * Get user's offers
   */
  async getOffers(type?: 'sent' | 'received'): Promise<Offer[]> {
    if (USE_MOCK_DATA) {
      await delay(200);

      // Combine sent and received offers from mock data
      const allOffers: Offer[] = [
        ...MOCK_OFFERS.received.map((o) => ({
          id: o.id,
          status: o.status,
          type: 'RECEIVED' as const,
          listing: o.listing,
          offeredItem: 'offeredListing' in o ? o.offeredListing : undefined,
          cashAmount: o.cashAmount,
          createdAt: o.createdAt,
          otherUser: {
            id: o.id,
            displayName: o.fromUser.displayName,
            rating: o.fromUser.rating,
          },
        })),
        ...MOCK_OFFERS.sent.map((o) => ({
          id: o.id,
          status: o.status,
          type: 'SENT' as const,
          listing: o.listing,
          offeredItem: 'offeredListing' in o ? o.offeredListing : undefined,
          cashAmount: 'cashAmount' in o ? (o.cashAmount as number) : undefined,
          createdAt: o.createdAt,
          otherUser: {
            id: o.id,
            displayName: o.toUser.displayName,
          },
        })),
      ];

      if (type) {
        return allOffers.filter((o) => o.type === type.toUpperCase());
      }

      return allOffers;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    type OfferWithDetails = OfferRow & {
      listings: { id: string; title: string; images: string[]; estimated_value: number } | null;
      offered_listings: { id: string; title: string; images: string[]; estimated_value: number } | null;
    };

    let query = supabase
      .from('offers')
      .select(`
        *,
        listings!offers_listing_id_fkey (
          id,
          title,
          images,
          estimated_value
        ),
        offered_listings:listings!offers_offered_listing_id_fkey (
          id,
          title,
          images,
          estimated_value
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('from_user_id', user.id);
    } else if (type === 'received') {
      query = query.eq('to_user_id', user.id);
    } else {
      query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    }

    const { data, error } = await query.returns<OfferWithDetails[]>();

    if (error) {
      console.error('Error fetching offers:', error);
      throw new Error(error.message);
    }

    const offers: Offer[] = [];

    for (const row of data || []) {
      const isSent = row.from_user_id === user.id;
      const otherUserId = isSent ? row.to_user_id : row.from_user_id;

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, rating')
        .eq('id', otherUserId)
        .single<Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'rating'>>();

      const listing = row.listings;
      const offeredListing = row.offered_listings;

      offers.push({
        id: row.id,
        status: row.status,
        type: isSent ? 'SENT' : 'RECEIVED',
        listing: {
          id: listing?.id || '',
          title: listing?.title || '',
          images: listing?.images || [],
          estimatedValue: listing?.estimated_value,
        },
        offeredItem: offeredListing ? {
          id: offeredListing.id,
          title: offeredListing.title,
          images: offeredListing.images,
          estimatedValue: offeredListing.estimated_value,
        } : undefined,
        cashAmount: row.cash_amount || undefined,
        createdAt: row.created_at,
        otherUser: {
          id: otherUserId,
          displayName: profile?.display_name || 'Unknown',
          avatar: profile?.avatar_url || undefined,
          rating: profile?.rating,
        },
      });
    }

    return offers;
  },

  /**
   * Create a new listing
   */
  async createListing(data: {
    title: string;
    description: string;
    estimatedValue: number;
    category: string;
    condition?: string;
    type: 'ITEM' | 'SERVICE';
    images: string[];
  }): Promise<Listing> {
    if (USE_MOCK_DATA) {
      await delay(500);
      // Return a mock created listing
      const newListing: Listing = {
        id: `mock-${Date.now()}`,
        ...data,
        userId: 'mock-user',
        location: 'Brooklyn, NY',
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
      };
      return newListing;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData = {
      user_id: user.id,
      title: data.title,
      description: data.description,
      estimated_value: data.estimatedValue,
      category: data.category,
      condition: data.condition,
      type: data.type,
      images: data.images,
    };

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(insertData as any)
      .select(`
        *,
        profiles (*)
      `)
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      throw new Error(error.message);
    }

    return transformListing(listing as ListingRow & { profiles: ProfileRow });
  },

  /**
   * Create an offer on a listing
   */
  async createOffer(data: {
    listingId: string;
    offeredItemId?: string;
    cashAmount?: number;
    message?: string;
  }): Promise<Offer> {
    if (USE_MOCK_DATA) {
      await delay(500);
      // Return a mock created offer
      return {
        id: `mock-offer-${Date.now()}`,
        status: 'PENDING',
        type: 'SENT',
        listing: MOCK_LISTINGS.find((l) => l.id === data.listingId) as any,
        cashAmount: data.cashAmount,
        createdAt: new Date().toISOString(),
        otherUser: {
          id: 'mock-other',
          displayName: 'Other User',
        },
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the listing to find the owner
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id, title, images, estimated_value')
      .eq('id', data.listingId)
      .single<Pick<ListingRow, 'user_id' | 'title' | 'images' | 'estimated_value'>>();

    if (!listing) throw new Error('Listing not found');

    const offerInsert = {
      listing_id: data.listingId,
      from_user_id: user.id,
      to_user_id: listing.user_id,
      offered_listing_id: data.offeredItemId,
      cash_amount: data.cashAmount,
      message: data.message,
    };

    const { data: offer, error } = await supabase
      .from('offers')
      .insert(offerInsert as any)
      .select()
      .single<OfferRow>();

    if (error) {
      console.error('Error creating offer:', error);
      throw new Error(error.message);
    }

    // Get other user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, rating')
      .eq('id', listing.user_id)
      .single<Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'rating'>>();

    return {
      id: offer!.id,
      status: offer!.status,
      type: 'SENT',
      listing: {
        id: data.listingId,
        title: listing.title,
        images: listing.images,
        estimatedValue: listing.estimated_value,
      },
      cashAmount: offer!.cash_amount || undefined,
      createdAt: offer!.created_at,
      otherUser: {
        id: listing.user_id,
        displayName: profile?.display_name || 'Unknown',
        avatar: profile?.avatar_url || undefined,
        rating: profile?.rating,
      },
    };
  },

  /**
   * Accept an offer
   */
  async acceptOffer(offerId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(300);
      return;
    }

    const { error } = await (supabase
      .from('offers') as any)
      .update({ status: 'ACCEPTED' })
      .eq('id', offerId);

    if (error) {
      console.error('Error accepting offer:', error);
      throw new Error(error.message);
    }
  },

  /**
   * Reject an offer
   */
  async rejectOffer(offerId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await delay(300);
      return;
    }

    const { error } = await (supabase
      .from('offers') as any)
      .update({ status: 'REJECTED' })
      .eq('id', offerId);

    if (error) {
      console.error('Error rejecting offer:', error);
      throw new Error(error.message);
    }
  },

  /**
   * Record a swipe action
   */
  async recordSwipe(listingId: string, direction: 'left' | 'right'): Promise<void> {
    if (USE_MOCK_DATA) {
      // No-op in mock mode
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const swipeData = {
      user_id: user.id,
      listing_id: listingId,
      direction,
    };

    const { error } = await supabase
      .from('swipes')
      .upsert(swipeData as any, {
        onConflict: 'user_id,listing_id',
      });

    if (error) {
      console.error('Error recording swipe:', error);
    }
  },

  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage(uri: string, bucket: 'listing-images' | 'avatars'): Promise<string> {
    if (USE_MOCK_DATA) {
      await delay(500);
      return uri; // Return the local URI in mock mode
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique filename
    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },
};

// Helper function for simulated delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
