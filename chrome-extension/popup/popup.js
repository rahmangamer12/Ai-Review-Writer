// 💡 PRODUCTION: Change this to your deployed URL
const API_BASE_URL = 'https://ai-review-writer.vercel.app'; 

// Fallback templates for offline mode (EXPANDED for variety)
const FALLBACK_TEMPLATES = {
  positive: [
    "Thank you {name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!",
    "We truly appreciate your kind words, {name}! It was our pleasure to serve you, and we look forward to seeing you again soon!",
    "Thank you so much, {name}! We're excited to hear you enjoyed your experience. Can't wait to welcome you back!",
    "Greatly appreciate the support, {name}! We're so happy we could meet your expectations. See you next time!",
    "Thanks for the 5 stars, {name}! We love hearing from happy customers. Enjoy!",
    "It was a pleasure serving you, {name}! We're glad you liked everything. See you soon!",
    "We're grinning ear to ear reading this, {name}! Thanks for making our day!",
  ],
  neutral: [
    "Thank you, {name}, for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.",
    "We value your input, {name}. Thank you for bringing this to our attention. We're committed to providing the best experience possible.",
    "Thanks for sharing your thoughts, {name}. We'll take this feedback into account as we continue to improve our service.",
    "We appreciate the honest feedback, {name}. We hope to serve you better next time!",
  ],
  negative: [
    "Hi {name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.",
    "Dear {name}, we're sorry to hear about your experience. This is not the standard we strive for. Please contact us so we can make things better.",
    "We apologize for the inconvenience, {name}. We are looking into this issue to ensure it doesn't happen again. Thank you for your patience.",
    "We're sorry to hear you weren't satisfied, {name}. We'd appreciate a chance to discuss this with you and improve.",
  ]
};

// Tone modifiers
const TONE_MODIFIERS = {
  professional: {
    positive: "Thank you for your positive feedback. We appreciate your business and look forward to serving you again.",
    neutral: "Thank you for your feedback. We will use this to improve our service.",
    negative: "We apologize for this experience. Please contact our management team to resolve this issue.",
  },
  friendly: {
    positive: "Yay! We're so happy you loved it, {name}! Can't wait to see you again!",
    neutral: "Thanks for the feedback, {name}! We're always working to be even better!",
    negative: "Oh no! We're so sorry, {name}. Let's fix this - reach out to us!",
  },
  apologetic: {
    positive: "Thank you so much! We're sorry for any past issues - we're working hard to be better!",
    neutral: "We truly appreciate your patience and feedback, {name}.",
    negative: "We're so sorry, {name}. This shouldn't have happened. Please let us make it right.",
  },
  enthusiastic: {
    positive: "WOW! Thank you {name}! You made our day! Come back soon!",
    neutral: "Thanks for sharing, {name}! Every bit of feedback helps us improve!",
    negative: "Oh no! We're devastated, {name}! Please give us another chance!",
  },
  desi: {
    positive: "Shukriya {name} bhai! Aapka review parh kar bohat khushi hui. Bohat bohat shukriya! ✨",
    neutral: "Thanks for the feedback, {name}. Hum mazeed behtar karne ki koshish karein ge. Shukriya!",
    negative: "Maazrat khwah hain {name} bhai. Humein dukh hua ke aapka experience acha nahi raha. Hum se rabta karein taake hum isay theek kar sakein. 🙏",
  }
};

// DOM Elements
const elements = {
  platformContainer: document.getElementById('platformContainer'),
  reviewSection: document.getElementById('reviewSection'),
  reviewerName: document.getElementById('reviewerName'),
  reviewRating: document.getElementById('reviewRating'),
  reviewText: document.getElementById('reviewText'),
  reviewCounter: document.getElementById('reviewCounter'),
  prevReviewBtn: document.getElementById('prevReviewBtn'),
  nextReviewBtn: document.getElementById('nextReviewBtn'),
  toneSelect: document.getElementById('toneSelect'),
  languageSelect: document.getElementById('languageSelect'),
  autoCopy: document.getElementById('autoCopy'),
  loadingState: document.getElementById('loadingState'),
  replySection: document.getElementById('replySection'),
  aiReply: document.getElementById('aiReply'),
  generateBtn: document.getElementById('generateBtn'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  errorMessage: document.getElementById('errorMessage'),
};

// All scraped reviews
let allReviews = [];
let currentReviewIndex = 0;
let currentPlatform = null;
let currentReview = null;

// Initialize
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    detectPlatform(tab.url);
    runDetection(tab);
  }
  
  loadSettings();
}

// Separate detection logic
async function runDetection(tab) {
  showLoading(true);
  hideError();
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeAllReviewsFromPage,
    });
    
    if (results && results[0] && results[0].result) {
      allReviews = results[0].result;
      console.log('[Popup] Found reviews:', allReviews.length);
      
      if (allReviews.length > 0) {
        currentReviewIndex = 0;
        displayReview(allReviews[0]);
      } else {
        showError('No reviews detected. Make sure reviews are loaded on the page.');
        elements.reviewSection.style.display = 'none';
        elements.generateBtn.textContent = '🔍 Detect Reviews on Page';
        elements.generateBtn.disabled = false;
      }
    }
  } catch (error) {
    console.log('Could not scrape page:', error);
    showError('Could not detect reviews. Try refreshing the page.');
  } finally {
    showLoading(false);
  }
}

// Handle Generate Button Click
async function handleGenerateClick() {
  if (elements.generateBtn.textContent.includes('Detect') || allReviews.length === 0) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) runDetection(tab);
  } else {
    generateReply();
  }
}

// Detect platform from URL
function detectPlatform(url) {
  const platforms = [
    { name: 'Google', pattern: /google\.com\/maps|business\.google/, class: 'platform-google' },
    { name: 'Facebook', pattern: /facebook\.com/, class: 'platform-facebook' },
    { name: 'Yelp', pattern: /yelp\.com/, class: 'platform-yelp' },
    { name: 'TripAdvisor', pattern: /tripadvisor\.com/, class: 'platform-tripadvisor' },
    { name: 'Trustpilot', pattern: /trustpilot\.com/, class: 'platform-trustpilot' },
  ];
  
  for (const platform of platforms) {
    if (platform.pattern.test(url)) {
      currentPlatform = platform.name.toLowerCase();
      elements.platformContainer.innerHTML = `<span class="platform-badge ${platform.class}">${platform.name}</span>`;
      elements.generateBtn.disabled = false;
      elements.generateBtn.textContent = '✨ Generate AI Reply';
      return;
    }
  }
  
  currentPlatform = 'other';
  elements.platformContainer.innerHTML = '<span class="platform-badge platform-other">Navigate to a review platform</span>';
}

// Scrape ALL reviews from page (Improved)
function scrapeAllReviewsFromPage() {
  const reviews = [];
  const url = window.location.href;
  
  function getPlatform() {
    if (url.includes('google.com/maps') || url.includes('business.google')) return 'google';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('yelp.com')) return 'yelp';
    if (url.includes('tripadvisor.com')) return 'tripadvisor';
    if (url.includes('trustpilot.com')) return 'trustpilot';
    return 'unknown';
  }
  
  const platform = getPlatform();
  
  const getText = (el, selectors) => {
    for (const selector of selectors) {
      const found = el.querySelector(selector);
      if (found && found.textContent.trim()) return found.textContent.trim();
    }
    return '';
  };

  if (platform === 'google') {
    const els = document.querySelectorAll('[data-review-id]');
    els.forEach((el, i) => {
      const text = getText(el, ['.wiI7pd', '.Gveq4b', '[class*="review-text"]']);
      if (text && text.length > 5) {
        const author = getText(el, ['.d4r55', '[class*="author"]']) || `Reviewer ${i+1}`;
        const ratingEl = el.querySelector('[aria-label*="star"]');
        const rating = parseInt(ratingEl?.getAttribute('aria-label')?.match(/(\d)/)?.[1]) || 5;
        reviews.push({ author, rating, text, platform: 'google' });
      }
    });
  } else if (platform === 'facebook') {
    document.querySelectorAll('[role="article"]').forEach((el, i) => {
      const text = getText(el, ['[dir="auto"]']);
      if (text && text.length > 10) {
        const author = getText(el, ['h3 a', 'strong']) || `Reviewer ${i+1}`;
        reviews.push({ author, rating: 5, text, platform: 'facebook' });
      }
    });
  } else if (platform === 'yelp') {
    document.querySelectorAll('.review').forEach((el, i) => {
      const text = getText(el, ['.raw__09f24__T4Ezm', '[class*="comment"]']);
      if (text) {
        const author = getText(el, ['.user-display-name']) || `Reviewer ${i+1}`;
        const ratingEl = el.querySelector('.i-stars');
        const rating = parseInt(ratingEl?.className?.match(/i-stars--(\d)-/)?.[1]) || 5;
        reviews.push({ author, rating, text, platform: 'yelp' });
      }
    });
  }
  
  return reviews;
}

// Display detected review
function displayReview(review) {
  if (!review) return;
  currentReview = review;
  elements.reviewerName.textContent = review.author || 'Customer';
  elements.reviewRating.textContent = '⭐'.repeat(review.rating || 5);
  elements.reviewText.textContent = review.text || 'No review text found.';
  elements.reviewSection.style.display = 'block';
  elements.generateBtn.disabled = false;
  elements.generateBtn.textContent = '✨ Generate AI Reply';
  
  if (allReviews.length > 0) {
    elements.reviewCounter.textContent = `${currentReviewIndex + 1} / ${allReviews.length}`;
  }
  
  elements.replySection.style.display = 'none';
  elements.aiReply.textContent = '';
}

// Navigation
function nextReview() {
  if (allReviews.length === 0) return;
  currentReviewIndex = (currentReviewIndex + 1) % allReviews.length;
  displayReview(allReviews[currentReviewIndex]);
}

function prevReview() {
  if (allReviews.length === 0) return;
  currentReviewIndex = (currentReviewIndex - 1 + allReviews.length) % allReviews.length;
  displayReview(allReviews[currentReviewIndex]);
}

// Generate AI reply
async function generateReply() {
  if (!currentReview) {
    showError('Please select a review first.');
    return;
  }
  
  showLoading(true);
  hideError();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/generate-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewText: currentReview.text,
        rating: currentReview.rating,
        authorName: currentReview.author,
        platform: currentReview.platform || currentPlatform,
        tone: elements.toneSelect.value,
        language: elements.languageSelect.value,
        nocache: Date.now()
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      const reply = data.reply || data.data?.reply;
      elements.aiReply.textContent = reply;
      elements.replySection.style.display = 'block';
      
      if (elements.autoCopy.checked) {
        await navigator.clipboard.writeText(reply);
        showTempMessage('✅ Copied!');
      }
    } else {
      throw new Error(data.error || data.details || 'API failed to generate reply');
    }
  } catch (error) {
    console.error('Error:', error);
    showError(`AI Error: ${error.message}. Please check your internet or API quota.`);
    elements.replySection.style.display = 'none';
  } finally {
    showLoading(false);
  }
}


// UI Helpers
function showLoading(show) {
  elements.loadingState.classList.toggle('active', show);
  elements.generateBtn.disabled = show;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('active');
}

function hideError() {
  elements.errorMessage.classList.remove('active');
}

function showTempMessage(message) {
  const originalText = elements.generateBtn.textContent;
  elements.generateBtn.textContent = message;
  setTimeout(() => {
    elements.generateBtn.textContent = originalText;
  }, 2000);
}

function saveSettings() {
  chrome.storage.sync.set({
    tone: elements.toneSelect.value,
    language: elements.languageSelect.value,
    autoCopy: elements.autoCopy.checked,
  });
}

function loadSettings() {
  chrome.storage.sync.get(['tone', 'language', 'autoCopy'], (data) => {
    if (data.tone) elements.toneSelect.value = data.tone;
    if (data.language) elements.languageSelect.value = data.language;
    if (data.autoCopy !== undefined) elements.autoCopy.checked = data.autoCopy;
  });
}

// Event listeners
elements.generateBtn.addEventListener('click', handleGenerateClick);
elements.regenerateBtn.addEventListener('click', generateReply);
elements.prevReviewBtn.addEventListener('click', prevReview);
elements.nextReviewBtn.addEventListener('click', nextReview);
elements.toneSelect.addEventListener('change', saveSettings);
elements.languageSelect.addEventListener('change', saveSettings);
elements.autoCopy.addEventListener('change', saveSettings);

// Start
init();
