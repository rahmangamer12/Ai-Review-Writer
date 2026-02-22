// Content Script - Scrapes reviews from supported platforms

console.log('[AutoReview AI] Content script loaded');

// Platform detection
const PLATFORM = detectPlatform();

function detectPlatform() {
  const url = window.location.href;
  if (url.includes('google.com/maps') || url.includes('business.google')) return 'google';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('yelp.com')) return 'yelp';
  if (url.includes('tripadvisor.com')) return 'tripadvisor';
  if (url.includes('trustpilot.com')) return 'trustpilot';
  return 'unknown';
}

// Scrape reviews based on platform
function scrapeReviews() {
  const reviews = [];
  
  switch (PLATFORM) {
    case 'google':
      reviews.push(...scrapeGoogleReviews());
      break;
    case 'facebook':
      reviews.push(...scrapeFacebookReviews());
      break;
    case 'yelp':
      reviews.push(...scrapeYelpReviews());
      break;
    case 'tripadvisor':
      reviews.push(...scrapeTripAdvisorReviews());
      break;
    case 'trustpilot':
      reviews.push(...scrapeTrustpilotReviews());
      break;
  }
  
  return reviews;
}

// Google Maps/Business Reviews
function scrapeGoogleReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[data-review-id]');
  
  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.d4r55, [class*="author"]')?.textContent?.trim() || 'Anonymous';
      const ratingEl = el.querySelector('[class*="kvMYJc"], [role="img"][aria-label*="star"]');
      const ratingText = ratingEl?.getAttribute('aria-label') || '';
      const rating = parseInt(ratingText.match(/(\d)/)?.[1]) || 5;
      const text = el.querySelector('[class*="wiI7pd"]')?.textContent?.trim() || '';
      const date = el.querySelector('[class*="rsqaWe"]')?.textContent?.trim() || '';
      
      if (text) {
        reviews.push({
          id: `google_${index}`,
          author,
          rating,
          text,
          date,
          platform: 'google',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping Google review:', e);
    }
  });
  
  return reviews;
}

// Facebook Reviews
function scrapeFacebookReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[role="article"]');
  
  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('h3 a, strong, [role="link"]')?.textContent?.trim() || 'Anonymous';
      const text = el.querySelector('[dir="auto"]')?.textContent?.trim() || '';
      
      if (text && text.length > 10) {
        reviews.push({
          id: `facebook_${index}`,
          author,
          rating: 5, // Facebook doesn't always show ratings
          text,
          date: '',
          platform: 'facebook',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping Facebook review:', e);
    }
  });
  
  return reviews;
}

// Yelp Reviews
function scrapeYelpReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('.review');
  
  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.user-display-name')?.textContent?.trim() || 'Anonymous';
      const ratingEl = el.querySelector('.i-stars');
      const ratingMatch = ratingEl?.className?.match(/i-stars--(\d)-/);
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
      const text = el.querySelector('.raw__09f24__T4Ezm, [class*="comment"]')?.textContent?.trim() || '';
      const date = el.querySelector('.text-color--subtle')?.textContent?.trim() || '';
      
      if (text) {
        reviews.push({
          id: `yelp_${index}`,
          author,
          rating,
          text,
          date,
          platform: 'yelp',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping Yelp review:', e);
    }
  });
  
  return reviews;
}

// TripAdvisor Reviews
function scrapeTripAdvisorReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('.review-container');
  
  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('.username, .memberOverlayLink')?.textContent?.trim() || 'Anonymous';
      const ratingEl = el.querySelector('.ui_bubble_rating');
      const ratingClass = ratingEl?.className?.match(/bubble_(\d\d)/);
      const rating = ratingClass ? parseInt(ratingClass[1]) / 10 : 5;
      const text = el.querySelector('.prw_rup .partial_entry')?.textContent?.trim() || '';
      const date = el.querySelector('.ratingDate')?.getAttribute('title') || '';
      
      if (text) {
        reviews.push({
          id: `tripadvisor_${index}`,
          author,
          rating,
          text,
          date,
          platform: 'tripadvisor',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping TripAdvisor review:', e);
    }
  });
  
  return reviews;
}

// Trustpilot Reviews
function scrapeTrustpilotReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('[data-review-id]');
  
  reviewElements.forEach((el, index) => {
    try {
      const author = el.querySelector('[data-consumer-name]')?.textContent?.trim() || 'Anonymous';
      const ratingEl = el.querySelector('[data-rating]');
      const rating = parseInt(ratingEl?.getAttribute('data-rating')) || 5;
      const text = el.querySelector('[data-review-content]')?.textContent?.trim() || '';
      const date = el.querySelector('time')?.textContent?.trim() || '';
      
      if (text) {
        reviews.push({
          id: `trustpilot_${index}`,
          author,
          rating,
          text,
          date,
          platform: 'trustpilot',
          element: el,
        });
      }
    } catch (e) {
      console.error('Error scraping Trustpilot review:', e);
    }
  });
  
  return reviews;
}

// Add AI Reply buttons to reviews
function addAIReplyButtons() {
  const reviews = scrapeReviews();
  
  reviews.forEach(review => {
    // Check if button already exists
    if (review.element.querySelector('.autoreview-ai-btn')) return;
    
    const btn = document.createElement('button');
    btn.className = 'autoreview-ai-btn';
    btn.innerHTML = '✨ AI Reply';
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      btn.textContent = '⏳ Generating...';
      btn.disabled = true;
      
      try {
        const reply = await generateAIReply(review);
        showReplyModal(review, reply);
      } catch (err) {
        alert('Error generating reply. Please try again.');
      } finally {
        btn.innerHTML = '✨ AI Reply';
        btn.disabled = false;
      }
    };
    
    review.element.appendChild(btn);
  });
}

// Generate AI reply
async function generateAIReply(review) {
  const API_URL = 'http://localhost:3000/api/reviews/generate-reply';
  // const API_URL = 'https://autoreview-ai.com/api/reviews/generate-reply';
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewText: review.text,
      rating: review.rating,
      authorName: review.author,
      platform: review.platform,
      tone: 'friendly',
      language: 'en',
    }),
  });
  
  const data = await response.json();
  if (data.success) {
    return data.data.reply;
  }
  throw new Error(data.error);
}

// Show reply modal
function showReplyModal(review, reply) {
  // Remove existing modal
  const existing = document.getElementById('autoreview-modal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'autoreview-modal';
  modal.innerHTML = `
    <div class="autoreview-modal-overlay"></div>
    <div class="autoreview-modal-content">
      <div class="autoreview-modal-header">
        <h3>✨ AI Generated Reply</h3>
        <button class="autoreview-close">&times;</button>
      </div>
      <div class="autoreview-modal-body">
        <div class="autoreview-review-preview">
          <strong>Original Review (${review.rating}⭐)</strong>
          <p>${review.text.substring(0, 150)}${review.text.length > 150 ? '...' : ''}</p>
        </div>
        <div class="autoreview-reply-box">
          <textarea id="autoreview-reply-text" rows="4">${reply}</textarea>
        </div>
      </div>
      <div class="autoreview-modal-footer">
        <button class="autoreview-btn autoreview-btn-secondary autoreview-regenerate">🔄 Regenerate</button>
        <button class="autoreview-btn autoreview-btn-primary autoreview-copy">📋 Copy</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  modal.querySelector('.autoreview-close').onclick = () => modal.remove();
  modal.querySelector('.autoreview-modal-overlay').onclick = () => modal.remove();
  
  modal.querySelector('.autoreview-copy').onclick = async () => {
    const text = modal.querySelector('#autoreview-reply-text').value;
    await navigator.clipboard.writeText(text);
    modal.querySelector('.autoreview-copy').textContent = '✅ Copied!';
    setTimeout(() => {
      modal.querySelector('.autoreview-copy').textContent = '📋 Copy';
    }, 2000);
  };
  
  modal.querySelector('.autoreview-regenerate').onclick = async () => {
    modal.querySelector('.autoreview-regenerate').textContent = '⏳ ...';
    try {
      const newReply = await generateAIReply(review);
      modal.querySelector('#autoreview-reply-text').value = newReply;
    } finally {
      modal.querySelector('.autoreview-regenerate').textContent = '🔄 Regenerate';
    }
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getReviews') {
    const reviews = scrapeReviews();
    sendResponse({ reviews });
  }
  if (request.action === 'getCurrentReview') {
    const reviews = scrapeReviews();
    sendResponse(reviews[0] || null);
  }
});

// Initialize
if (PLATFORM !== 'unknown') {
  console.log(`[AutoReview AI] Detected platform: ${PLATFORM}`);
  
  // Add buttons on page load
  setTimeout(addAIReplyButtons, 2000);
  
  // Watch for new reviews (infinite scroll)
  const observer = new MutationObserver(() => {
    addAIReplyButtons();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
