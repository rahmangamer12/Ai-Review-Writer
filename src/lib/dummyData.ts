/**
 * Dummy Data for Demo Mode
 * Shows impressive sample data when user has no real reviews yet
 */

export const dummyReviews = [
  {
    id: 'demo-1',
    author_name: 'Sarah Ahmed',
    rating: 5,
    content: 'Outstanding service! The food was delicious and the staff was incredibly friendly. Will definitely come back!',
    platform: 'google',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    sentiment_label: 'positive',
    sentiment_score: 0.95,
    emotion_label: 'delighted',
    status: 'published',
    ai_reply: 'Thank you so much, Sarah! We\'re thrilled you enjoyed your experience. Looking forward to serving you again soon! 🙏'
  },
  {
    id: 'demo-2',
    author_name: 'Ahmed Khan',
    rating: 4,
    content: 'Good food and nice ambiance. Service was a bit slow but overall a pleasant experience.',
    platform: 'yelp',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    sentiment_label: 'positive',
    sentiment_score: 0.75,
    emotion_label: 'satisfied',
    status: 'published',
    ai_reply: 'Thank you for your feedback, Ahmed! We apologize for the slow service and are working to improve. We\'re glad you enjoyed the food and ambiance! 🌟'
  },
  {
    id: 'demo-3',
    author_name: 'Maria Rodriguez',
    rating: 5,
    content: 'Best biryani in town! Fast delivery and excellent packaging. Highly recommend!',
    platform: 'google',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    sentiment_label: 'positive',
    sentiment_score: 0.98,
    emotion_label: 'enthusiastic',
    status: 'published',
    ai_reply: 'Wow! Thank you so much, Maria! Your kind words mean the world to us. We\'re so happy you loved the biryani! 🍛❤️'
  },
  {
    id: 'demo-4',
    author_name: 'Ali Hassan',
    rating: 3,
    content: 'Food quality is good but portion sizes could be better for the price.',
    platform: 'facebook',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    sentiment_label: 'neutral',
    sentiment_score: 0.45,
    emotion_label: 'moderate',
    status: 'pending',
    ai_reply: null
  },
  {
    id: 'demo-5',
    author_name: 'Fatima Malik',
    rating: 5,
    content: 'Excellent customer service! They went above and beyond to make sure everything was perfect.',
    platform: 'google',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    sentiment_label: 'positive',
    sentiment_score: 0.96,
    emotion_label: 'grateful',
    status: 'published',
    ai_reply: 'Thank you so much, Fatima! Our team is dedicated to providing the best experience possible. We appreciate your kind words! 💫'
  }
]

export const dummyAnalytics = {
  total_reviews: 127,
  average_rating: 4.6,
  sentiment_distribution: {
    positive: 89,
    neutral: 24,
    negative: 14
  },
  auto_reply_rate: 87.4,
  time_saved_minutes: 635,
  response_time_avg: 12, // minutes
  top_emotions: [
    { emotion: 'happy', count: 45 },
    { emotion: 'satisfied', count: 32 },
    { emotion: 'grateful', count: 28 }
  ],
  platform_breakdown: {
    google: 68,
    yelp: 32,
    facebook: 18,
    tripadvisor: 9
  }
}

export function getDummyReviews() {
  return dummyReviews
}

export function getDummyAnalytics() {
  return dummyAnalytics
}

export function enableDemoMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo-mode', 'true')
  }
}

export function disableDemoMode() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo-mode')
  }
}

export function isDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('demo-mode') === 'true'
  }
  return false
}
