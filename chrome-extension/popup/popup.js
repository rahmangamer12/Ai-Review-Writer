// AutoReview AI Chrome Extension - Popup Script

const API_BASE_URL = 'https://autoreview-ai.com'; // Change to your domain
// const API_BASE_URL = 'http://localhost:3000'; // For local testing

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
      headers: { 'Content-Type': 'application/json' },
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
      const reply = data.data.reply;
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
      showError(data.error || 'Failed to generate reply');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Network error. Please check your connection.');
  } finally {
    showLoading(false);
  }
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
