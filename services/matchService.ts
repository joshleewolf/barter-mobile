// Trade Service - Tracks interest and detects mutual trade opportunities
// In production, this would be backed by a database

interface Interest {
  fromUserId: string;
  toUserId: string;
  fromItemId: string;
  toItemId: string;
  timestamp: number;
}

interface TradeOpportunity {
  id: string;
  user1Id: string;
  user2Id: string;
  item1Id: string;
  item2Id: string;
  timestamp: number;
  status: 'pending' | 'negotiating' | 'completed' | 'declined';
}

// In-memory storage for demo (would be database in production)
const interests: Interest[] = [];
const tradeOpportunities: TradeOpportunity[] = [];

// Current user ID (would come from auth in production)
const CURRENT_USER_ID = 'current-user';

// Simulate other users having already shown interest in our items
// This creates instant trade opportunities for demo purposes
const preloadedInterests: Interest[] = [
  {
    fromUserId: 'user-2',
    toUserId: CURRENT_USER_ID,
    fromItemId: '2', // Vintage Camera
    toItemId: 'my-item-1',
    timestamp: Date.now() - 100000,
  },
  {
    fromUserId: 'user-4',
    toUserId: CURRENT_USER_ID,
    fromItemId: '4', // Gaming Console
    toItemId: 'my-item-1',
    timestamp: Date.now() - 50000,
  },
];

// Initialize with preloaded interests
interests.push(...preloadedInterests);

export const tradeService = {
  /**
   * Record interest (swipe right) on an item
   * Returns a TradeOpportunity if mutual interest is detected
   */
  recordInterest(toItemId: string, toUserId: string): TradeOpportunity | null {
    const interest: Interest = {
      fromUserId: CURRENT_USER_ID,
      toUserId,
      fromItemId: 'my-item-1', // Current user's item being offered
      toItemId,
      timestamp: Date.now(),
    };

    interests.push(interest);

    // Check if the other user has already shown interest in our items
    const mutualInterest = interests.find(
      (i) =>
        i.fromUserId === toUserId &&
        i.toUserId === CURRENT_USER_ID
    );

    if (mutualInterest) {
      // Trade Unlocked!
      const opportunity: TradeOpportunity = {
        id: `trade-${Date.now()}`,
        user1Id: CURRENT_USER_ID,
        user2Id: toUserId,
        item1Id: mutualInterest.toItemId, // Our item they want
        item2Id: toItemId, // Their item we want
        timestamp: Date.now(),
        status: 'pending',
      };

      tradeOpportunities.push(opportunity);
      return opportunity;
    }

    return null;
  },

  /**
   * Record a pass (swipe left) on an item
   */
  recordPass(toItemId: string, toUserId: string): void {
    // In production, we'd track passes to avoid showing the item again
    console.log(`Passed on item ${toItemId} from user ${toUserId}`);
  },

  /**
   * Get all trade opportunities for the current user
   */
  getTradeOpportunities(): TradeOpportunity[] {
    return tradeOpportunities.filter(
      (t) => t.user1Id === CURRENT_USER_ID || t.user2Id === CURRENT_USER_ID
    );
  },

  /**
   * Check if we've already shown interest in an item
   */
  hasShownInterest(itemId: string): boolean {
    return interests.some(
      (i) => i.fromUserId === CURRENT_USER_ID && i.toItemId === itemId
    );
  },

  /**
   * Get trade opportunity by ID
   */
  getTradeOpportunity(tradeId: string): TradeOpportunity | undefined {
    return tradeOpportunities.find((t) => t.id === tradeId);
  },

  /**
   * Update trade status
   */
  updateTradeStatus(tradeId: string, status: TradeOpportunity['status']): void {
    const trade = tradeOpportunities.find((t) => t.id === tradeId);
    if (trade) {
      trade.status = status;
    }
  },
};

export type { Interest, TradeOpportunity };
