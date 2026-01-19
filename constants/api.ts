import { config } from './config';

// API Configuration - reads from app.config.ts based on APP_ENV
export const API_BASE_URL = config.apiUrl;

export const ENDPOINTS = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',

  // Users
  user: (id: string) => `/users/${id}`,
  userByUsername: (username: string) => `/users/username/${username}`,
  updateProfile: '/users/profile',
  myStats: '/users/me/stats',

  // Listings
  listings: '/listings',
  listing: (id: string) => `/listings/${id}`,
  myListings: '/listings/user/me',
  userListings: (userId: string) => `/listings/user/${userId}`,
  discoveryFeed: '/listings/discover/feed',
  swipe: (listingId: string) => `/listings/swipe/${listingId}`,

  // Offers
  offers: '/offers',
  offer: (id: string) => `/offers/${id}`,
  sentOffers: '/offers/sent',
  receivedOffers: '/offers/received',
  acceptOffer: (id: string) => `/offers/${id}/accept`,
  rejectOffer: (id: string) => `/offers/${id}/reject`,
  counterOffer: (id: string) => `/offers/${id}/counter`,
  cancelOffer: (id: string) => `/offers/${id}/cancel`,

  // AI
  cashSuggestion: (listingId: string) => `/ai/suggest/${listingId}`,
  canTrade: '/ai/can-trade',
  myTradeableItems: '/ai/my-items',

  // Messages
  conversations: '/messages/conversations',
  conversation: (id: string) => `/messages/conversations/${id}`,
  conversationByOffer: (offerId: string) => `/messages/offer/${offerId}`,
  markRead: (id: string) => `/messages/conversations/${id}/read`,

  // Trades
  trades: '/trades',
  trade: (id: string) => `/trades/${id}`,
  updateTradeStatus: (id: string) => `/trades/${id}/status`,
  createReview: (tradeId: string) => `/trades/${tradeId}/review`,
  userReviews: (userId: string) => `/trades/reviews/${userId}`,
};
