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
  
  // Find all review containers
  const reviewContainers = getAllReviewContainers();
  
  reviewContainers.forEach((container, index) => {
    // Check if button already exists
    if (container.querySelector('.autoreview-ai-btn')) return;
    
    const btn = document.createElement('button');
    btn.className = 'autoreview-ai-btn';
    btn.innerHTML = '✨ AI Reply';
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get review data from this container
      const reviewData = getReviewFromContainer(container);
      if (!reviewData || !reviewData.text) {
        alert('Could not detect review. Please try opening the extension popup directly.');
        return;
      }
      
      btn.textContent = '⏳ Generating...';
      btn.disabled = true;
      
      try {
        const reply = await generateAIReply(reviewData);
        showReplyModal(reviewData, reply);
      } catch (err) {
        console.error('Error:', err);
        // Show fallback modal with manual input
        showReplyModal(reviewData, getFallbackReply(reviewData.rating, reviewData.author));
      } finally {
        btn.innerHTML = '✨ AI Reply';
        btn.disabled = false;
      }
    };
    
    container.appendChild(btn);
  });
}

// Get all review containers - improved selectors
function getAllReviewContainers() {
  const containers = [];
  
  // Google Maps
  document.querySelectorAll('[data-review-id]').forEach(el => containers.push(el));
  
  // Facebook
  document.querySelectorAll('[role="article"]').forEach(el => {
    if (el.querySelector('[dir="auto"]')) containers.push(el);
  });
  
  // Yelp
  document.querySelectorAll('.review').forEach(el => containers.push(el));
  
  // TripAdvisor
  document.querySelectorAll('.review-container').forEach(el => containers.push(el));
  
  // Trustpilot
  document.querySelectorAll('[data-review-id]').forEach(el => containers.push(el));
  
  return containers;
}

// Get review data from container element
function getReviewFromContainer(container) {
  const platform = PLATFORM;
  let author = 'Customer';
  let rating = 5;
  let text = '';
  
  try {
    if (platform === 'google') {
      author = container.querySelector('.d4r55, [class*="author"]')?.textContent?.trim() || 'Customer';
      const ratingEl = container.querySelector('[class*="kvMYJc"], [role="img"][aria-label*="star"]');
      const ratingText = ratingEl?.getAttribute('aria-label') || '';
      rating = parseInt(ratingText.match(/(\d)/)?.[1]) || 5;
      text = container.querySelector('[class*="wiI7pd"]')?.textContent?.trim() || '';
    } else if (platform === 'facebook') {
      author = container.querySelector('h3 a, strong')?.textContent?.trim() || 'Customer';
      text = container.querySelector('[dir="auto"]')?.textContent?.trim() || '';
      rating = 5;
    } else if (platform === 'yelp') {
      author = container.querySelector('.user-display-name')?.textContent?.trim() || 'Customer';
      const ratingEl = container.querySelector('.i-stars');
      const ratingMatch = ratingEl?.className?.match(/i-stars--(\d)-/);
      rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
      text = container.querySelector('.raw__09f24__T4Ezm, [class*="comment"]')?.textContent?.trim() || '';
    } else if (platform === 'tripadvisor') {
      author = container.querySelector('.username, .memberOverlayLink')?.textContent?.trim() || 'Customer';
      const ratingEl = container.querySelector('.ui_bubble_rating');
      const ratingClass = ratingEl?.className?.match(/bubble_(\d\d)/);
      rating = ratingClass ? parseInt(ratingClass[1]) / 10 : 5;
      text = container.querySelector('.prw_rup .partial_entry')?.textContent?.trim() || '';
    } else if (platform === 'trustpilot') {
      author = container.querySelector('[data-consumer-name]')?.textContent?.trim() || 'Customer';
      const ratingEl = container.querySelector('[data-rating]');
      rating = parseInt(ratingEl?.getAttribute('data-rating')) || 5;
      text = container.querySelector('[data-review-content]')?.textContent?.trim() || '';
    }
  } catch (e) {
    console.error('Error getting review data:', e);
  }
  
  return { author, rating, text, platform };
}

// Fallback reply templates
function getFallbackReply(rating, authorName) {
  const name = authorName || 'there';
  const templates = {
    positive: [
      `Thank you ${name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!`,
      `We truly appreciate your kind words, ${name}! It was our pleasure to serve you, and we look forward to seeing you again soon!`,
    ],
    neutral: [
      `Thank you, ${name}, for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.`,
    ],
    negative: [
      `Hi ${name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.`,
    ]
  };
  
  const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  const templateList = templates[sentiment];
  return templateList[Math.floor(Math.random() * templateList.length)];
}

// Generate AI reply
async function generateAIReply(review) {
  // Use production URL
  const API_URL = 'https://ai-review-writer.vercel.app/api/reviews/generate-reply';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewText: review.text,
        rating: review.rating,
        authorName: review.author,
        platform: review.platform || 'google',
        tone: 'friendly',
        language: 'en',
      }),
    });
    
    const data = await response.json();
    if (data.success) {
      return data.reply || data.data?.reply || getFallbackReply(review.rating, review.author);
    }
    throw new Error(data.error || 'API error');
  } catch (error) {
    console.error('API Error:', error);
    return getFallbackReply(review.rating, review.author);
  }
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
