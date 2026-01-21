// Mock data for development without backend

export const MOCK_USER = {
  id: 'user-1',
  email: 'demo@barter.app',
  username: 'demo_user',
  displayName: 'Demo User',
  avatar: null,
  rating: 4.5,
  totalTrades: 12,
};

export const MOCK_LISTINGS = [
  {
    id: 'listing-1',
    title: 'iPhone 14 Pro - Excellent Condition',
    description: 'Barely used iPhone 14 Pro, 256GB, Deep Purple. Comes with original box, charger, and a premium case. Battery health at 98%. No scratches or dents.',
    estimatedValue: 850,
    images: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400'],
    condition: 'LIKE_NEW',
    category: 'Electronics',
    type: 'ITEM',
    tags: ['apple', 'smartphone', 'tech'],
    viewCount: 234,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7849, longitude: -122.4094, name: 'San Francisco, CA' },
    user: {
      id: 'user-2',
      username: 'techie_mike',
      displayName: 'Mike Johnson',
      avatar: null,
      rating: 4.8,
      totalTrades: 45,
      createdAt: '2023-06-15T00:00:00Z',
    },
  },
  {
    id: 'listing-2',
    title: 'Vintage Gibson Les Paul Guitar',
    description: '1995 Gibson Les Paul Standard in Heritage Cherry Sunburst. Amazing tone, plays like butter. Some minor wear but adds character. Includes hardshell case.',
    estimatedValue: 2200,
    images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'],
    condition: 'GOOD',
    category: 'Music',
    type: 'ITEM',
    tags: ['guitar', 'gibson', 'vintage', 'music'],
    viewCount: 156,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7749, longitude: -122.4294, name: 'Hayes Valley, SF' },
    user: {
      id: 'user-3',
      username: 'guitar_hero',
      displayName: 'Sarah Williams',
      avatar: null,
      rating: 4.9,
      totalTrades: 28,
      createdAt: '2022-11-20T00:00:00Z',
    },
  },
  {
    id: 'listing-3',
    title: 'Mountain Bike - Trek Fuel EX 8',
    description: 'Full suspension mountain bike, size Large. Perfect for trail riding. New tires, recently serviced. Ready to hit the trails!',
    estimatedValue: 1800,
    images: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400'],
    condition: 'GOOD',
    category: 'Sports',
    type: 'ITEM',
    tags: ['bike', 'mountain bike', 'trek', 'outdoor'],
    viewCount: 89,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7649, longitude: -122.4494, name: 'Golden Gate Park' },
    user: {
      id: 'user-4',
      username: 'trail_blazer',
      displayName: 'Jake Thompson',
      avatar: null,
      rating: 4.6,
      totalTrades: 15,
      createdAt: '2023-02-10T00:00:00Z',
    },
  },
  {
    id: 'listing-4',
    title: 'Professional Photography Session',
    description: '2-hour professional photo session. Includes 20 edited high-res images. Perfect for portraits, headshots, or small events. Flexible scheduling.',
    estimatedValue: 300,
    images: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400'],
    condition: null,
    category: 'Services',
    type: 'SERVICE',
    tags: ['photography', 'portraits', 'professional'],
    viewCount: 67,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7949, longitude: -122.3994, name: 'SOMA, SF' },
    user: {
      id: 'user-5',
      username: 'lens_master',
      displayName: 'Emily Chen',
      avatar: null,
      rating: 5.0,
      totalTrades: 52,
      createdAt: '2022-08-05T00:00:00Z',
    },
  },
  {
    id: 'listing-5',
    title: 'PS5 + 10 Games Bundle',
    description: 'PlayStation 5 disc edition with 2 controllers and 10 popular games including Spider-Man 2, God of War, and more. All in perfect working condition.',
    estimatedValue: 650,
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400'],
    condition: 'LIKE_NEW',
    category: 'Games',
    type: 'ITEM',
    tags: ['playstation', 'gaming', 'ps5', 'console'],
    viewCount: 312,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7549, longitude: -122.4194, name: 'Mission District, SF' },
    user: {
      id: 'user-6',
      username: 'gamer_pro',
      displayName: 'Alex Rivera',
      avatar: null,
      rating: 4.7,
      totalTrades: 33,
      createdAt: '2023-01-18T00:00:00Z',
    },
  },
  {
    id: 'listing-6',
    title: 'Herman Miller Aeron Chair',
    description: 'Size B, fully loaded with all adjustments. The ultimate office chair. Some wear on armrests but everything works perfectly. Retails for $1,400+.',
    estimatedValue: 600,
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400'],
    condition: 'GOOD',
    category: 'Home & Garden',
    type: 'ITEM',
    tags: ['office', 'chair', 'ergonomic', 'herman miller'],
    viewCount: 145,
    createdAt: new Date().toISOString(),
    location: { latitude: 37.7899, longitude: -122.4014, name: 'Financial District, SF' },
    user: {
      id: 'user-7',
      username: 'office_upgrade',
      displayName: 'David Kim',
      avatar: null,
      rating: 4.4,
      totalTrades: 8,
      createdAt: '2023-09-01T00:00:00Z',
    },
  },
];

export const MOCK_USER_LISTINGS = [
  {
    id: 'my-listing-1',
    title: 'MacBook Pro 14" M2',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    estimatedValue: 1500,
    status: 'ACTIVE',
  },
  {
    id: 'my-listing-2',
    title: 'Nintendo Switch OLED',
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'],
    estimatedValue: 280,
    status: 'ACTIVE',
  },
];

export const MOCK_OFFERS = {
  received: [
    {
      id: 'offer-1',
      type: 'CASH',
      status: 'PENDING',
      cashAmount: 1350,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      listing: {
        id: 'my-listing-1',
        title: 'MacBook Pro 14" M2',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
      },
      fromUser: {
        displayName: 'Mike Johnson',
        rating: 4.8,
      },
    },
    {
      id: 'offer-2',
      type: 'COMBO',
      status: 'PENDING',
      cashAmount: 200,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      listing: {
        id: 'my-listing-2',
        title: 'Nintendo Switch OLED',
        images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'],
      },
      offeredListing: {
        title: 'Xbox Series S',
        images: ['https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400'],
      },
      fromUser: {
        displayName: 'Alex Rivera',
        rating: 4.7,
      },
    },
  ],
  sent: [
    {
      id: 'offer-3',
      type: 'ITEM',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      listing: {
        id: 'listing-1',
        title: 'iPhone 14 Pro',
        images: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400'],
      },
      offeredListing: {
        title: 'MacBook Pro 14" M2',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
      },
      toUser: {
        displayName: 'Mike Johnson',
      },
    },
  ],
};

export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-1',
    unreadCount: 2,
    lastMessage: {
      content: 'Hey, is this still available?',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    otherParticipant: {
      displayName: 'Mike Johnson',
      avatar: null,
    },
    offer: {
      listing: {
        title: 'MacBook Pro 14" M2',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
      },
    },
  },
  {
    id: 'conv-2',
    unreadCount: 0,
    lastMessage: {
      content: 'Sounds good! Let me know when works for you.',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    otherParticipant: {
      displayName: 'Sarah Williams',
      avatar: null,
    },
    offer: {
      listing: {
        title: 'Vintage Gibson Les Paul',
        images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400'],
      },
    },
  },
];

export const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    content: 'Hi! I saw your listing and I\'m very interested.',
    senderId: 'user-2',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sender: { displayName: 'Mike Johnson' },
  },
  {
    id: 'msg-2',
    content: 'Hey! Thanks for reaching out. What would you like to know?',
    senderId: 'user-1',
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    sender: { displayName: 'Demo User' },
  },
  {
    id: 'msg-3',
    content: 'Is it still in good condition? Any issues I should know about?',
    senderId: 'user-2',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sender: { displayName: 'Mike Johnson' },
  },
  {
    id: 'msg-4',
    content: 'Hey, is this still available?',
    senderId: 'user-2',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    sender: { displayName: 'Mike Johnson' },
  },
];

export const generateCashSuggestion = (listing: any) => {
  const baseValue = listing.estimatedValue;
  const conditionMultiplier = listing.condition === 'NEW' ? 1 :
    listing.condition === 'LIKE_NEW' ? 0.9 :
    listing.condition === 'GOOD' ? 0.75 : 0.6;

  const suggestedAmount = Math.round(baseValue * conditionMultiplier);

  return {
    listingId: listing.id,
    suggestedAmount,
    minAmount: Math.round(suggestedAmount * 0.7),
    maxAmount: Math.round(suggestedAmount * 1.3),
    confidence: 0.85,
    factors: {
      baseValue,
      conditionMultiplier,
      demandScore: 1.1,
      sellerRating: 1.0,
    },
  };
};
