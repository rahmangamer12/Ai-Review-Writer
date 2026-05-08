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

// State
let currentReview = null;
let currentPlatform = null;

// Initialize
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    detectPlatform(tab.url);
    
    // Try to scrape review from page
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeReviewFromPage,
      });
      
      if (results && results[0] && results[0].result) {
        const review = results[0].result;
        if (review.found) {
          displayReview(review);
        }
      }
    } catch (error) {
      console.log('Could not scrape page:', error);
    }
  }
  
  // Load saved settings
  loadSettings();
}

// Detect platform from URL
function detectPlatform(url) {
  const platforms = [
    { name: 'Google', pattern: /google\.com\/maps|business\.google/, class: 'platform-google' },
    { name: 'Facebook', pattern: /facebook\.com/, class: 'platform-facebook' },
    { name: 'Yelp', pattern: /yelp\.com/, class: 'platform-yelp' },
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
  elements.platformContainer.innerHTML = '<span class="platform-badge platform-other">Navigate to Google, Facebook, or Yelp</span>';
}

// Scrape function to inject into page
function scrapeReviewFromPage() {
  // Google Maps Reviews
  const googleReview = document.querySelector('[data-review-id]');
  if (googleReview) {
    const author = googleReview.querySelector('.d4r55')?.textContent || 
                   googleReview.querySelector('[class*="author"]')?.textContent || 
                   'Anonymous';
    const ratingEl = googleReview.querySelector('[class*="kvMYJc"], [role="img"][aria-label*="star"]');
    const rating = ratingEl ? parseInt(ratingEl.getAttribute('aria-label')) : 5;
    const text = googleReview.querySelector('[class*="wiI7pd"], [data-review-id] span')?.textContent || '';
    
    if (text) {
      return { found: true, author, rating, text, platform: 'google' };
    }
  }
  
  // Facebook Reviews
  const fbReview = document.querySelector('[role="article"]');
  if (fbReview && window.location.href.includes('facebook')) {
    const author = fbReview.querySelector('h3 a, strong')?.textContent || 'Anonymous';
    const text = fbReview.querySelector('[dir="auto"]')?.textContent || '';
    return { found: true, author, rating: 5, text, platform: 'facebook' };
  }
  
  // Yelp Reviews
  const yelpReview = document.querySelector('.review');
  if (yelpReview) {
    const author = yelpReview.querySelector('.user-display-name')?.textContent || 'Anonymous';
    const ratingEl = yelpReview.querySelector('.i-stars');
    const rating = ratingEl ? parseInt(ratingEl.className.match(/i-stars--(\d)-/)[1]) : 5;
    const text = yelpReview.querySelector('.raw__09f24__T4Ezm')?.textContent || '';
    return { found: true, author, rating, text, platform: 'yelp' };
  }
  
  return { found: false };
}

// Display detected review
function displayReview(review) {
  currentReview = review;
  elements.reviewerName.textContent = review.author;
  elements.reviewRating.textContent = '⭐'.repeat(review.rating);
  elements.reviewText.textContent = review.text.substring(0, 200) + (review.text.length > 200 ? '...' : '');
  elements.reviewSection.style.display = 'block';
  elements.generateBtn.disabled = false;
}

// Generate AI reply
async function generateReply() {
  if (!currentReview) return;
  
  showLoading(true);
  hideError();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/generate-reply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewText: currentReview.text,
        rating: currentReview.rating,
        authorName: currentReview.author,
        platform: currentPlatform,
        tone: elements.toneSelect.value,
        language: elements.languageSelect.value,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      const reply = data.data?.reply || data.reply;
      elements.aiReply.textContent = reply;
      elements.replySection.style.display = 'block';
      
      // Auto-copy if enabled
      if (elements.autoCopy.checked) {
        await navigator.clipboard.writeText(reply);
        showTempMessage('Reply copied to clipboard!');
      }
      
      // Save to storage
      saveReplyToHistory(currentReview, reply);
    } else {
      // Use fallback template if API fails
      const fallbackReply = getFallbackReply(currentReview.rating, elements.toneSelect.value, currentReview.author);
      elements.aiReply.textContent = fallbackReply;
      elements.replySection.style.display = 'block';
      showTempMessage('Using offline reply');
    }
  } catch (error) {
    console.error('Error:', error);
    // Use fallback template for any error
    const fallbackReply = getFallbackReply(currentReview.rating, elements.toneSelect.value, currentReview.author);
    elements.aiReply.textContent = fallbackReply;
    elements.replySection.style.display = 'block';
    showTempMessage('Offline mode - reply generated');
  } finally {
    showLoading(false);
  }
}

// Get fallback reply using templates
function getFallbackReply(rating, tone, authorName) {
  const templates = FALLBACK_TEMPLATES;
  const modifiers = TONE_MODIFIERS;
  const name = authorName || 'there';
  
  // Determine sentiment category
  let sentiment = 'neutral';
  if (rating >= 4) sentiment = 'positive';
  else if (rating <= 2) sentiment = 'negative';
  
  // Get base template
  const baseTemplate = templates[sentiment][Math.floor(Math.random() * templates[sentiment].length)];
  let reply = baseTemplate.replace(/{name}/g, name);
  
  // Apply tone modifier if provided and exists
  if (modifiers[tone] && modifiers[tone][sentiment]) {
    const toneReply = modifiers[tone][sentiment].replace(/{name}/g, name);
    // Mix base with tone
    if (tone === 'professional') {
      reply = toneReply;
    } else if (tone === 'friendly') {
      reply = toneReply;
    } else if (tone === 'apologetic') {
      reply = `${toneReply} ${baseTemplate.replace(/{name}/g, name)}`;
    } else if (tone === 'enthusiastic') {
      reply = toneReply;
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

// Save reply to history
function saveReplyToHistory(review, reply) {
  chrome.storage.local.get(['replyHistory'], (data) => {
    const history = data.replyHistory || [];
    history.unshift({
      review: review.text.substring(0, 100),
      reply,
      platform: currentPlatform,
      timestamp: Date.now(),
    });
    // Keep only last 50
    if (history.length > 50) history.pop();
    chrome.storage.local.set({ replyHistory: history });
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
