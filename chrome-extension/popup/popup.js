// 💡 PRODUCTION: Change this to your deployed URL
const API_BASE_URL = 'https://ai-review-writer.vercel.app'; 
// 🏠 LOCAL: http://localhost:3000

// Fallback templates for offline mode
const FALLBACK_TEMPLATES = {
  positive: [
    "Thank you {name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!",
    "We truly appreciate your kind words, {name}! It was our pleasure to serve you, and we look forward to seeing you again soon!",
    "Thank you so much, {name}! We're excited to hear you enjoyed your experience. Can't wait to welcome you back!",
  ],
  neutral: [
    "Thank you, {name}, for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.",
    "We value your input, {name}. Thank you for bringing this to our attention. We're committed to providing the best experience possible.",
  ],
  negative: [
    "Hi {name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.",
    "Dear {name}, we're sorry to hear about your experience. This is not the standard we strive for. Please contact us so we can make things better.",
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
  }
};

// DOM Elements
const elements = {
  platformContainer: document.getElementById('platformContainer'),
  reviewSection: document.getElementById('reviewSection'),
  reviewerName: document.getElementById('reviewerName'),
  reviewRating: document.getElementById('reviewRating'),
  reviewText: document.getElementById('reviewText'),
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

// Initialize
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    detectPlatform(tab.url);
    
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
        }
      }
    } catch (error) {
      console.log('Could not scrape page:', error);
      showError('Could not detect reviews. Try refreshing the page.');
    }
  }
  
  loadSettings();
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

// Scrape ALL reviews from page
function scrapeAllReviewsFromPage() {
  const reviews = [];
  const url = window.location.href;
  
  // Google Maps - multiple selectors
  if (url.includes('google.com/maps') || url.includes('business.google')) {
    const reviewEls = document.querySelectorAll('[data-review-id]');
    reviewEls.forEach((el, index) => {
      try {
        const authorEl = el.querySelector('.d4r55, [class*="author"]');
        const author = authorEl?.textContent?.trim() || el.querySelector('[class*="y"]')?.textContent?.trim() || `Reviewer ${index + 1}`;
        
        const ratingEl = el.querySelector('[class*="kvMYJc"], [role="img"][aria-label*="star"]');
        let rating = 5;
        if (ratingEl) {
          const ariaLabel = ratingEl.getAttribute('aria-label') || '';
          const match = ariaLabel.match(/(\d)/);
          rating = match ? parseInt(match[1]) : 5;
        }
        
        const textEl = el.querySelector('[class*="wiI7pd"], [class*="review-text"]');
        const text = textEl?.textContent?.trim() || '';
        
        if (text && text.length > 5) {
          reviews.push({
            id: index,
            author,
            rating,
            text: text.substring(0, 500),
            platform: 'google'
          });
        }
      } catch (e) {}
    });
  }
  
  // Facebook
  if (url.includes('facebook.com')) {
    const reviewEls = document.querySelectorAll('[role="article"]');
    reviewEls.forEach((el, index) => {
      try {
        const text = el.querySelector('[dir="auto"]')?.textContent?.trim() || '';
        if (text && text.length > 10) {
          const author = el.querySelector('h3 a, strong')?.textContent?.trim() || `Reviewer ${index + 1}`;
          reviews.push({
            id: index,
            author,
            rating: 5,
            text: text.substring(0, 500),
            platform: 'facebook'
          });
        }
      } catch (e) {}
    });
  }
  
  // Yelp
  if (url.includes('yelp.com')) {
    const reviewEls = document.querySelectorAll('.review');
    reviewEls.forEach((el, index) => {
      try {
        const author = el.querySelector('.user-display-name')?.textContent?.trim() || `Reviewer ${index + 1}`;
        const ratingEl = el.querySelector('.i-stars');
        let rating = 5;
        if (ratingEl) {
          const match = ratingEl.className?.match(/i-stars--(\d)-/);
          rating = match ? parseInt(match[1]) : 5;
        }
        const text = el.querySelector('.raw__09f24__T4Ezm, [class*="comment"]')?.textContent?.trim() || '';
        if (text && text.length > 5) {
          reviews.push({
            id: index,
            author,
            rating,
            text: text.substring(0, 500),
            platform: 'yelp'
          });
        }
      } catch (e) {}
    });
  }
  
  // TripAdvisor
  if (url.includes('tripadvisor.com')) {
    const reviewEls = document.querySelectorAll('.review-container');
    reviewEls.forEach((el, index) => {
      try {
        const author = el.querySelector('.username, .memberOverlayLink')?.textContent?.trim() || `Reviewer ${index + 1}`;
        const ratingEl = el.querySelector('.ui_bubble_rating');
        let rating = 5;
        if (ratingEl) {
          const match = ratingEl.className?.match(/bubble_(\d\d)/);
          rating = match ? parseInt(match[1]) / 10 : 5;
        }
        const text = el.querySelector('.prw_rup .partial_entry')?.textContent?.trim() || '';
        if (text && text.length > 5) {
          reviews.push({
            id: index,
            author,
            rating,
            text: text.substring(0, 500),
            platform: 'tripadvisor'
          });
        }
      } catch (e) {}
    });
  }
  
  // Trustpilot
  if (url.includes('trustpilot.com')) {
    const reviewEls = document.querySelectorAll('[data-review-id]');
    reviewEls.forEach((el, index) => {
      try {
        const author = el.querySelector('[data-consumer-name]')?.textContent?.trim() || `Reviewer ${index + 1}`;
        const ratingEl = el.querySelector('[data-rating]');
        const rating = ratingEl ? parseInt(ratingEl.getAttribute('data-rating')) : 5;
        const text = el.querySelector('[data-review-content]')?.textContent?.trim() || '';
        if (text && text.length > 5) {
          reviews.push({
            id: index,
            author,
            rating,
            text: text.substring(0, 500),
            platform: 'trustpilot'
          });
        }
      } catch (e) {}
    });
  }
  
  return reviews;
}

// Display detected review
function displayReview(review) {
  currentReview = review;
  elements.reviewerName.textContent = review.author;
  elements.reviewRating.textContent = '⭐'.repeat(review.rating);
  elements.reviewText.textContent = review.text.substring(0, 200) + (review.text.length > 200 ? '...' : '');
  elements.reviewSection.style.display = 'block';
  elements.generateBtn.disabled = false;
  
  // Add review count info
  if (allReviews.length > 1) {
    elements.reviewSection.innerHTML += `<p style="margin-top:10px;font-size:12px;color:#888;">Review ${currentReviewIndex + 1} of ${allReviews.length}</p>`;
  }
}

// Generate AI reply
async function generateReply() {
  if (!currentReview) return;
  
  showLoading(true);
  hideError();
  
  const reviewData = allReviews[currentReviewIndex] || currentReview;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/generate-reply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewText: reviewData.text,
        rating: reviewData.rating,
        authorName: reviewData.author,
        platform: currentPlatform,
        tone: elements.toneSelect.value,
        language: elements.languageSelect.value,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      const reply = data.reply || data.data?.reply;
      elements.aiReply.textContent = reply;
      elements.replySection.style.display = 'block';
      
      if (elements.autoCopy.checked) {
        await navigator.clipboard.writeText(reply);
        showTempMessage('Reply copied!');
      }
    } else {
      const fallbackReply = getFallbackReply(reviewData.rating, elements.toneSelect.value, reviewData.author);
      elements.aiReply.textContent = fallbackReply;
      elements.replySection.style.display = 'block';
      showTempMessage('Offline reply');
    }
  } catch (error) {
    console.error('Error:', error);
    const fallbackReply = getFallbackReply(reviewData.rating, elements.toneSelect.value, reviewData.author);
    elements.aiReply.textContent = fallbackReply;
    elements.replySection.style.display = 'block';
    showTempMessage('Offline mode');
  } finally {
    showLoading(false);
  }
}

// Get fallback reply
function getFallbackReply(rating, tone, authorName) {
  const templates = FALLBACK_TEMPLATES;
  const modifiers = TONE_MODIFIERS;
  const name = authorName || 'there';
  
  let sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  const baseTemplate = templates[sentiment][Math.floor(Math.random() * templates[sentiment].length)];
  let reply = baseTemplate.replace(/{name}/g, name);
  
  if (modifiers[tone] && modifiers[tone][sentiment]) {
    const toneReply = modifiers[tone][sentiment].replace(/{name}/g, name);
    if (tone === 'professional' || tone === 'friendly' || tone === 'enthusiastic') {
      reply = toneReply;
    } else if (tone === 'apologetic') {
      reply = toneReply + ' ' + baseTemplate.replace(/{name}/g, name);
    }
  }
  
  return reply;
}

// Show/hide loading
function showLoading(show) {
  elements.loadingState.classList.toggle('active', show);
  elements.generateBtn.disabled = show;
}

// Show error
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('active');
}

// Hide error
function hideError() {
  elements.errorMessage.classList.remove('active');
}

// Show temporary message
function showTempMessage(message) {
  const originalText = elements.generateBtn.textContent;
  elements.generateBtn.textContent = message;
  setTimeout(() => {
    elements.generateBtn.textContent = originalText;
  }, 2000);
}

// Save settings
function saveSettings() {
  chrome.storage.sync.set({
    tone: elements.toneSelect.value,
    language: elements.languageSelect.value,
    autoCopy: elements.autoCopy.checked,
  });
}

// Load settings
function loadSettings() {
  chrome.storage.sync.get(['tone', 'language', 'autoCopy'], (data) => {
    if (data.tone) elements.toneSelect.value = data.tone;
    if (data.language) elements.languageSelect.value = data.language;
    if (data.autoCopy !== undefined) elements.autoCopy.checked = data.autoCopy;
  });
}

// Event listeners
elements.generateBtn.addEventListener('click', generateReply);
elements.regenerateBtn.addEventListener('click', generateReply);
elements.toneSelect.addEventListener('change', saveSettings);
elements.languageSelect.addEventListener('change', saveSettings);
elements.autoCopy.addEventListener('change', saveSettings);

// Initialize
init();
