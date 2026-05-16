// AutoReview AI - Popup Script
// Version 1.1.2

// ─── Configuration ────────────────────────────────────────────────────────────
// Users can override this in popup settings; falls back to production URL
const DEFAULT_API_URL = 'https://ai-review-writer.vercel.app';

function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiUrl'], (data) => {
      resolve(data.apiUrl || DEFAULT_API_URL);
    });
  });
}

// ─── Fallback Templates ───────────────────────────────────────────────────────
const FALLBACK_TEMPLATES = {
  positive: [
    "Thank you {name} for your wonderful review! We're thrilled you had such a great experience with us!",
    "We truly appreciate your kind words, {name}! It was our pleasure to serve you.",
    "Thank you so much, {name}! We're excited to hear you enjoyed your experience.",
    "Greatly appreciate the support, {name}! We're so happy we could meet your expectations.",
    "Thanks for the 5 stars, {name}! We love hearing from happy customers.",
    "It was a pleasure serving you, {name}! We're glad you liked everything.",
    "We're grinning ear to ear reading this, {name}! Thanks for making our day!",
  ],
  neutral: [
    "Thank you, {name}, for your feedback. We appreciate you taking the time to share your experience.",
    "We value your input, {name}. Thank you for bringing this to our attention.",
    "Thanks for sharing your thoughts, {name}. We'll take this feedback into account.",
    "We appreciate the honest feedback, {name}. We hope to serve you better next time!",
  ],
  negative: [
    "Hi {name}, we sincerely apologize that your experience didn't meet your expectations. Please reach out to us directly.",
    "Dear {name}, we're sorry to hear about your experience. Please contact us so we can make things better.",
    "We apologize for the inconvenience, {name}. We are looking into this issue.",
    "We're sorry to hear you weren't satisfied, {name}. We'd appreciate a chance to discuss this.",
  ]
};

function getFallbackReply(rating, tone, name) {
  const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  const templates = FALLBACK_TEMPLATES[sentiment];
  let template = templates[Math.floor(Math.random() * templates.length)];
  template = template.replace(/\{name\}/g, name || 'there');

  if (tone === 'professional') {
    return sentiment === 'positive'
      ? `Thank you for your positive feedback, ${name}. We appreciate your business.`
      : sentiment === 'negative'
      ? `We apologize for this experience, ${name}. Please contact our management team.`
      : `Thank you for your feedback, ${name}. We will use this to improve.`;
  }
  if (tone === 'desi') {
    return sentiment === 'positive'
      ? `Shukriya ${name} bhai! Aapka review parh kar bohat khushi hui! ✨`
      : sentiment === 'negative'
      ? `Maazrat khwah hain ${name} bhai. Hum se rabta karein taake hum isay theek kar sakein. 🙏`
      : `Shukriya ${name}! Hum mazeed behtar karne ki koshish karein ge.`;
  }
  return template;
}

// ─── DOM Elements ──────────────────────────────────────────────────────────────
const elements = {
  platformContainer: document.getElementById('platformContainer'),
  reviewSection: document.getElementById('reviewSection'),
  reviewerName: document.getElementById('reviewerName'),
  reviewRating: document.getElementById('reviewRating'),
  reviewText: document.getElementById('reviewText'),
  reviewCounter: document.getElementById('reviewCounter'),
  reviewSearch: document.getElementById('reviewSearch'),
  reviewSelect: document.getElementById('reviewSelect'),
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
  settingsBtn: document.getElementById('settingsBtn'),
  settingsPanel: document.getElementById('settingsPanel'),
  apiUrlInput: document.getElementById('apiUrlInput'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
};

// ─── State ─────────────────────────────────────────────────────────────────────
let allReviews = [];
let filteredReviews = [];
let currentReviewIndex = 0;
let currentPlatform = null;
let currentReview = null;

// ─── Initialize ────────────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    detectPlatform(tab.url);
    await runDetection(tab);
  }

  loadSettings();
  setupEventListeners();
}

// ─── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  if (elements.generateBtn) {
    elements.generateBtn.addEventListener('click', handleGenerateClick);
  }
  if (elements.regenerateBtn) {
    elements.regenerateBtn.addEventListener('click', generateReply);
  }
  if (elements.prevReviewBtn) {
    elements.prevReviewBtn.addEventListener('click', prevReview);
  }
  if (elements.nextReviewBtn) {
    elements.nextReviewBtn.addEventListener('click', nextReview);
  }
  if (elements.reviewSearch) {
    elements.reviewSearch.addEventListener('input', applyReviewFilter);
  }
  if (elements.reviewSelect) {
    elements.reviewSelect.addEventListener('change', () => {
      const selectedIndex = Number(elements.reviewSelect.value);
      if (Number.isFinite(selectedIndex) && filteredReviews[selectedIndex]) {
        currentReviewIndex = selectedIndex;
        displayReview(filteredReviews[currentReviewIndex]);
      }
    });
  }
  if (elements.toneSelect) {
    elements.toneSelect.addEventListener('change', saveSettings);
  }
  if (elements.languageSelect) {
    elements.languageSelect.addEventListener('change', saveSettings);
  }
  if (elements.autoCopy) {
    elements.autoCopy.addEventListener('change', saveSettings);
  }
  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', () => {
      if (elements.settingsPanel) {
        elements.settingsPanel.style.display = elements.settingsPanel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
  if (elements.saveSettingsBtn) {
    elements.saveSettingsBtn.addEventListener('click', () => {
      if (elements.apiUrlInput) {
        chrome.storage.sync.set({ apiUrl: elements.apiUrlInput.value.trim() }, () => {
          showTempMessage('✅ Saved!');
        });
      }
    });
  }
}

// ─── Platform Detection ───────────────────────────────────────────────────────
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
      if (elements.platformContainer) {
        elements.platformContainer.replaceChildren();
        const badge = document.createElement('span');
        badge.className = `platform-badge ${platform.class}`;
        badge.textContent = platform.name;
        elements.platformContainer.appendChild(badge);
      }
      if (elements.generateBtn) {
        elements.generateBtn.disabled = false;
        elements.generateBtn.textContent = '✨ Generate AI Reply';
      }
      return;
    }
  }

  currentPlatform = 'other';
  if (elements.platformContainer) {
    elements.platformContainer.replaceChildren();
    const badge = document.createElement('span');
    badge.className = 'platform-badge platform-other';
    badge.textContent = 'Navigate to a review platform';
    elements.platformContainer.appendChild(badge);
  }
}

// ─── Review Scraping ──────────────────────────────────────────────────────────
async function runDetection(tab) {
  showLoading(true);
  hideError();

  try {
    // First try: inject a content script function via executeScript
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeAllReviewsFromPage,
    });

    if (results && results[0] && results[0].result && results[0].result.length > 0) {
      allReviews = results[0].result;
    } else {
      // Second try: send message to existing content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getReviews' });
        allReviews = response?.reviews || [];
      } catch {
        // Content script not loaded — inject it manually
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/scraper.js'],
        });
        // Wait a moment then try again
        await new Promise(r => setTimeout(r, 1000));
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getReviews' });
          allReviews = response?.reviews || [];
        } catch {
          allReviews = [];
        }
      }
    }

    console.log('[Popup] Found reviews:', allReviews.length);

    if (allReviews.length > 0) {
      currentReviewIndex = 0;
      applyReviewFilter();
    } else {
      showError('No reviews detected. Make sure reviews are loaded on the page, then try again.');
      if (elements.reviewSection) elements.reviewSection.style.display = 'none';
      if (elements.generateBtn) {
        elements.generateBtn.textContent = '🔍 Detect Reviews on Page';
        elements.generateBtn.disabled = false;
      }
    }
  } catch (error) {
    console.log('Could not scrape page:', error);
    showError('Could not access page. Try refreshing the page and reopening the extension.');
    if (elements.reviewSection) elements.reviewSection.style.display = 'none';
  } finally {
    showLoading(false);
  }
}

// This function runs in the page context via executeScript
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

  function getText(el, selectors) {
    for (const selector of selectors) {
      const found = el.querySelector(selector);
      if (found && found.textContent.trim()) return found.textContent.trim();
    }
    return '';
  }

  function getRating(el, selectors) {
    for (const selector of selectors) {
      const found = el.querySelector(selector);
      if (found) {
        const label = found.getAttribute('aria-label') || '';
        const match = label.match(/(\d)/);
        if (match) return parseInt(match[1]);
        const className = found.className || '';
        const classMatch = className.match(/bubble_(\d\d)/);
        if (classMatch) return parseInt(classMatch[1]) / 10;
        const starsMatch = className.match(/i-stars--(\d)-/);
        if (starsMatch) return parseInt(starsMatch[1]);
        const dataRating = found.getAttribute('data-rating');
        if (dataRating) return parseInt(dataRating);
      }
    }
    return 5;
  }

  const platform = getPlatform();

  if (platform === 'google') {
    const els = document.querySelectorAll('[data-review-id]');
    els.forEach((el, i) => {
      const text = getText(el, ['.wiI7pd', '.Gveq4b', '[class*="review-text"]']);
      if (text && text.length > 5) {
        const author = getText(el, ['.d4r55', '[class*="author"]']) || `Reviewer ${i + 1}`;
        const rating = getRating(el, ['[aria-label*="star"]']);
        reviews.push({ author, rating, text, platform: 'google' });
      }
    });
  } else if (platform === 'facebook') {
    document.querySelectorAll('[role="article"]').forEach((el, i) => {
      const text = getText(el, ['[dir="auto"]']);
      if (text && text.length > 10) {
        const author = getText(el, ['h3 a', 'strong', '[role="link"]']) || `Reviewer ${i + 1}`;
        reviews.push({ author, rating: 5, text, platform: 'facebook' });
      }
    });
  } else if (platform === 'yelp') {
    document.querySelectorAll('.review, [class*="review__"]').forEach((el, i) => {
      const text = getText(el, ['.raw__09f24__T4Ezm', '[class*="comment"]', '[class*="review-content"]']);
      if (text && text.length > 5) {
        const author = getText(el, ['.user-display-name', '[class*="user-name"]']) || `Reviewer ${i + 1}`;
        const rating = getRating(el, ['.i-stars']);
        reviews.push({ author, rating, text, platform: 'yelp' });
      }
    });
  } else if (platform === 'tripadvisor') {
    document.querySelectorAll('.review-container, [class*="review-container"]').forEach((el, i) => {
      const text = getText(el, ['.prw_rup .partial_entry', '[class*="partial_entry"]', '[class*="review-text"]']);
      if (text && text.length > 5) {
        const author = getText(el, ['.username', '.memberOverlayLink', '[class*="username"]']) || `Reviewer ${i + 1}`;
        const rating = getRating(el, ['.ui_bubble_rating']);
        reviews.push({ author, rating, text, platform: 'tripadvisor' });
      }
    });
  } else if (platform === 'trustpilot') {
    document.querySelectorAll('[data-review-id], [class*="review-card"]').forEach((el, i) => {
      const text = getText(el, ['[data-review-content]', '[class*="review-content"]', 'p']);
      if (text && text.length > 5) {
        const author = getText(el, ['[data-consumer-name]', '[class*="consumer-name"]']) || `Reviewer ${i + 1}`;
        const rating = getRating(el, ['[data-rating]', '[class*="star-rating"]']);
        reviews.push({ author, rating, text, platform: 'trustpilot' });
      }
    });
  }

  return reviews;
}

// ─── Display Review ────────────────────────────────────────────────────────────
function displayReview(review) {
  if (!review) return;
  currentReview = review;

  if (elements.reviewerName) elements.reviewerName.textContent = review.author || 'Customer';
  if (elements.reviewRating) elements.reviewRating.textContent = '⭐'.repeat(review.rating || 5);
  if (elements.reviewText) elements.reviewText.textContent = review.text || 'No review text found.';
  if (elements.reviewSection) elements.reviewSection.style.display = 'block';
  if (elements.generateBtn) {
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = '✨ Generate AI Reply';
  }

  if (filteredReviews.length > 0 && elements.reviewCounter) {
    elements.reviewCounter.textContent = `${currentReviewIndex + 1} / ${filteredReviews.length}`;
  }

  if (elements.reviewSelect) {
    elements.reviewSelect.value = String(currentReviewIndex);
  }

  if (elements.replySection) elements.replySection.style.display = 'none';
  if (elements.aiReply) elements.aiReply.textContent = '';
}

// ─── Navigation ────────────────────────────────────────────────────────────────
function applyReviewFilter() {
  const query = (elements.reviewSearch?.value || '').trim().toLowerCase();
  filteredReviews = allReviews.filter((review) => {
    if (!query) return true;
    return `${review.author || ''} ${review.text || ''} ${review.platform || ''}`.toLowerCase().includes(query);
  });

  if (elements.reviewSelect) {
    elements.reviewSelect.replaceChildren();
    filteredReviews.forEach((review, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      const author = review.author || 'Customer';
      const rating = review.rating ? `${review.rating} star` : 'review';
      const preview = (review.text || '').replace(/\s+/g, ' ').slice(0, 70);
      option.textContent = `${index + 1}. ${author} - ${rating}${preview ? ` - ${preview}` : ''}`;
      elements.reviewSelect.appendChild(option);
    });
  }

  if (filteredReviews.length === 0) {
    currentReview = null;
    if (elements.reviewSection) elements.reviewSection.style.display = 'block';
    if (elements.reviewerName) elements.reviewerName.textContent = 'No match';
    if (elements.reviewRating) elements.reviewRating.textContent = '-';
    if (elements.reviewText) elements.reviewText.textContent = 'No detected reviews match your search.';
    if (elements.reviewCounter) elements.reviewCounter.textContent = '0 / 0';
    if (elements.generateBtn) elements.generateBtn.disabled = true;
    if (elements.replySection) elements.replySection.style.display = 'none';
    return;
  }

  currentReviewIndex = Math.min(currentReviewIndex, filteredReviews.length - 1);
  displayReview(filteredReviews[currentReviewIndex]);
}

function nextReview() {
  if (filteredReviews.length === 0) return;
  currentReviewIndex = (currentReviewIndex + 1) % filteredReviews.length;
  displayReview(filteredReviews[currentReviewIndex]);
}

function prevReview() {
  if (filteredReviews.length === 0) return;
  currentReviewIndex = (currentReviewIndex - 1 + filteredReviews.length) % filteredReviews.length;
  displayReview(filteredReviews[currentReviewIndex]);
}

// ─── Generate AI Reply ────────────────────────────────────────────────────────
async function handleGenerateClick() {
  if (!elements.generateBtn) return;

  if (elements.generateBtn.textContent.includes('Detect') || allReviews.length === 0) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await runDetection(tab);
  } else {
    await generateReply();
  }
}

async function generateReply() {
  if (!currentReview) {
    showError('Please select a review first.');
    return;
  }

  showLoading(true);
  hideError();

  const API_URL = await getApiUrl();
  const tone = elements.toneSelect ? elements.toneSelect.value : 'friendly';

  try {
    const response = await fetch(`${API_URL}/api/reviews/generate-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewText: currentReview.text,
        rating: currentReview.rating,
        authorName: currentReview.author,
        platform: currentReview.platform || currentPlatform || 'google',
        tone: tone,
        language: elements.languageSelect ? elements.languageSelect.value : 'en',
      }),
    });

    const data = await response.json();

    if (data.success) {
      const reply = data.reply || data.data?.reply;
      if (elements.aiReply) elements.aiReply.textContent = reply;
      if (elements.replySection) elements.replySection.style.display = 'block';

      // Auto-copy if enabled
      if (elements.autoCopy && elements.autoCopy.checked && reply) {
        try {
          await navigator.clipboard.writeText(reply);
          showTempMessage('✅ Copied!');
        } catch {
          // Clipboard failed — non-critical
        }
      }
    } else {
      // API returned error — use fallback
      console.warn('[Popup] API error, using fallback:', data.error);
      const fallbackReply = getFallbackReply(currentReview.rating, tone, currentReview.author);
      if (elements.aiReply) elements.aiReply.textContent = fallbackReply;
      if (elements.replySection) elements.replySection.style.display = 'block';
      showError(`AI service unavailable. Using offline template. (${data.error || 'Unknown error'})`);
    }
  } catch (error) {
    console.error('[Popup] Error:', error);
    // Network error — use fallback template
    const fallbackReply = getFallbackReply(currentReview.rating, tone, currentReview.author);
    if (elements.aiReply) elements.aiReply.textContent = fallbackReply;
    if (elements.replySection) elements.replySection.style.display = 'block';
    showError('Could not reach AI server. Using offline template.');
  } finally {
    showLoading(false);
  }
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────
function showLoading(show) {
  if (elements.loadingState) elements.loadingState.classList.toggle('active', show);
  if (elements.generateBtn) elements.generateBtn.disabled = show;
}

function showError(message) {
  if (elements.errorMessage) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.add('active');
  }
}

function hideError() {
  if (elements.errorMessage) elements.errorMessage.classList.remove('active');
}

function showTempMessage(message) {
  if (!elements.generateBtn) return;
  const originalText = elements.generateBtn.textContent;
  elements.generateBtn.textContent = message;
  setTimeout(() => {
    if (elements.generateBtn) elements.generateBtn.textContent = originalText;
  }, 2000);
}

function saveSettings() {
  chrome.storage.sync.set({
    tone: elements.toneSelect ? elements.toneSelect.value : 'friendly',
    language: elements.languageSelect ? elements.languageSelect.value : 'en',
    autoCopy: elements.autoCopy ? elements.autoCopy.checked : false,
  });
}

function loadSettings() {
  chrome.storage.sync.get(['tone', 'language', 'autoCopy', 'apiUrl'], (data) => {
    if (data.tone && elements.toneSelect) elements.toneSelect.value = data.tone;
    if (data.language && elements.languageSelect) elements.languageSelect.value = data.language;
    if (data.autoCopy !== undefined && elements.autoCopy) elements.autoCopy.checked = data.autoCopy;
    if (data.apiUrl && elements.apiUrlInput) elements.apiUrlInput.value = data.apiUrl;
  });
}

// ─── Start ─────────────────────────────────────────────────────────────────────
init();
