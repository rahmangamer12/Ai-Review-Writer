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

// Google Maps/Business Reviews - IMPROVED SELECTORS
function scrapeGoogleReviews() {
  const reviews = [];
  
  // Try multiple selectors for review containers
  let reviewElements = document.querySelectorAll('[data-review-id]');
  
  // Fallback: look for review-like containers
  if (reviewElements.length === 0) {
    reviewElements = document.querySelectorAll('.wiI7pd, [class*="review-text"], [class*="review-body"]');
  }
  
  reviewElements.forEach((el, index) => {
    try {
      // Get text - try multiple selectors
      let text = '';
      const textSelectors = [
        '[class*="wiI7pd"]', 
        '[class*="review-text"]',
        '[class*="review-body"]',
        '.Gveq4b', // Google Maps review text class
        '[data-review-text]'
      ];
      
      for (const selector of textSelectors) {
        const textEl = el.querySelector(selector);
        if (textEl) {
          text = textEl.textContent?.trim() || '';
          if (text) break;
        }
      }
      
      // If no text found, try the element itself
      if (!text && el.textContent) {
        text = el.textContent.trim();
      }
      
      if (!text || text.length < 5) return; // Skip empty/short text
      
      // Get author
      let author = 'Customer';
      const authorSelectors = ['.d4r55', '[class*="author"]', '[class*="y"]', '[data-author]'];
      for (const selector of authorSelectors) {
        const authorEl = el.querySelector(selector);
        if (authorEl) {
          author = authorEl.textContent?.trim() || 'Customer';
          if (author && author !== 'Customer') break;
        }
      }
      
      // Get rating
      let rating = 5;
      const ratingSelectors = ['[class*="kvMYJc"]', '[role="img"][aria-label*="star"]', '[aria-label*="star"]'];
      for (const selector of ratingSelectors) {
        const ratingEl = el.querySelector(selector);
        if (ratingEl) {
          const ariaLabel = ratingEl.getAttribute('aria-label') || '';
          const match = ariaLabel.match(/(\d)/);
          if (match) {
            rating = parseInt(match[1]);
            break;
          }
        }
      }
      
      reviews.push({
        id: `google_${index}`,
        author,
        rating,
        text,
        date: '',
        platform: 'google',
        element: el,
      });
    } catch (e) {
      // Skip errors
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
  const reviewContainers = getAllReviewContainers();
  
  reviewContainers.forEach((container) => {
    // Check if button already exists (with more robust check)
    if (container.querySelector('.autoreview-ai-btn')) return;
    
    // Check if container is valid
    const reviewData = getReviewFromContainer(container);
    if (!reviewData.text || reviewData.text.length < 5) return;

    const btn = document.createElement('button');
    btn.className = 'autoreview-ai-btn';
    btn.innerHTML = '✨ AI Reply';
    btn.type = 'button';
    
    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // RE-SCRAPE FRESH ON CLICK to ensure we have the right review
      const freshData = getReviewFromContainer(container);
      if (!freshData.text || freshData.text.length < 5) return;

      btn.textContent = '⏳ ...';
      btn.disabled = true;
      
      try {
        const reply = await generateAIReply(freshData);
        showReplyModal(freshData, reply);
      } catch (err) {
        console.error('Error:', err);
        const fallbackReply = getFallbackReply(freshData.rating, freshData.author);
        showReplyModal(freshData, fallbackReply);
      } finally {
        btn.innerHTML = '✨ AI Reply';
        btn.disabled = false;
      }
    };
    
    try {
      // Find a good place to append the button
      const actionsArea = container.querySelector('[role="group"], .m7vYec, ._15_v, .review-footer');
      if (actionsArea) {
        actionsArea.appendChild(btn);
      } else {
        container.appendChild(btn);
      }
    } catch (e) {
      console.log('[AutoReview AI] Could not append button:', e);
    }
  });
}

// Get all unique review containers
function getAllReviewContainers() {
  const containerSet = new Set();
  
  const selectors = [
    '[data-review-id]',
    '[role="article"]',
    '.review',
    '.review-container'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      // Platform specific validation
      if (PLATFORM === 'facebook' && !el.querySelector('[dir="auto"]')) return;
      if (PLATFORM === 'google' && !el.hasAttribute('data-review-id')) {
         if (!el.querySelector('.wiI7pd') && !el.className.includes('review')) return;
      }
      
      containerSet.add(el);
    });
  });
  
  return Array.from(containerSet);
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
      text = container.querySelector('[class*="wiI7pd"], .Gveq4b')?.textContent?.trim() || '';
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
function getFallbackReply(rating, authorName, tone = 'friendly') {
  const name = authorName || 'there';
  const templates = {
    positive: [
      `Thank you ${name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!`,
      `We truly appreciate your kind words, ${name}! It was our pleasure to serve you, and we look forward to seeing you again soon!`,
      `Thank you so much, ${name}! We're excited to hear you enjoyed your experience. Can't wait to welcome you back!`,
      `Greatly appreciate the support, ${name}! We're so happy we could meet your expectations. See you next time!`,
      `Thanks for the 5 stars, ${name}! We love hearing from happy customers. Enjoy!`,
    ],
    neutral: [
      `Thank you, ${name}, for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.`,
      `We value your input, ${name}. Thank you for bringing this to our attention. We're committed to providing the best experience possible.`,
      `Thanks for sharing your thoughts, ${name}. We'll take this feedback into account as we continue to improve our service.`,
    ],
    negative: [
      `Hi ${name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.`,
      `Dear ${name}, we're sorry to hear about your experience. This is not the standard we strive for. Please contact us so we can make things better.`,
      `We apologize for the inconvenience, ${name}. We are looking into this issue to ensure it doesn't happen again. Thank you for your patience.`,
    ]
  };

  // Desi fallbacks
  const desiTemplates = {
    positive: [
      `Shukriya ${name} bhai! Aapka review parh kar bohat khushi hui. Hamari koshish hoti hai ke behtreen service dein. Dubara zaroor aaiye ga!`,
      `Bohat bohat shukriya ${name}! Aapka feedback hamare liye bohat ahmiyat rakhta hai. Khush rahein!`,
      `JazakAllah ${name}! Aapka review parh kar maza aa gaya. Dubara jald aaiye ga!`,
    ],
    neutral: [
      `Shukriya ${name}! Hum mazeed behtar karne ki koshish karein ge.`,
      `Thanks for the feedback ${name}. Hum is par kaam karein ge.`,
    ],
    negative: [
      `Bohat afsos hua ${name} bhai aapka ye experience jaan kar. Hum maazrat khwah hain. Baraye meharbani hum se rabta karein taake hum isay theek kar sakein.`,
      `Maazrat ${name} bhai. Ye hamara standard nahi hai. Humein moqa dein taake hum isay theek kar sakein.`,
    ]
  };
  
  const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  const activeTemplates = tone === 'desi' ? (desiTemplates[sentiment] || templates[sentiment]) : templates[sentiment];
  
  return activeTemplates[Math.floor(Math.random() * activeTemplates.length)];
}


// Generate AI reply
async function generateAIReply(review, tone = 'friendly') {
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
        tone: tone,
        language: tone === 'desi' ? 'ur' : 'en',
      }),
    });
    
    const data = await response.json();
    if (data.success) {
      return data.reply || data.data?.reply || getFallbackReply(review.rating, review.author, tone);
    }
    throw new Error(data.error || 'API error');
  } catch (error) {
    console.error('API Error:', error);
    return getFallbackReply(review.rating, review.author, tone);
  }
}

// Show reply modal (Improved)
function showReplyModal(review, reply) {
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
          <strong>Review by ${review.author} (${review.rating}⭐)</strong>
          <p>${review.text.substring(0, 150)}${review.text.length > 150 ? '...' : ''}</p>
        </div>
        
        <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
          <label style="color: #a0aec0; font-size: 13px;">Tone:</label>
          <select id="autoreview-tone-select" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 8px; font-size: 12px;">
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="apologetic">Apologetic</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="desi">Desi Style</option>
          </select>
        </div>

        <div class="autoreview-reply-box">
          <textarea id="autoreview-reply-text" rows="5">${reply}</textarea>
        </div>
      </div>
      <div class="autoreview-modal-footer">
        <button class="autoreview-btn autoreview-btn-secondary autoreview-regenerate">🔄 Regenerate</button>
        <button class="autoreview-btn autoreview-btn-primary autoreview-copy">📋 Copy Reply</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const textArea = modal.querySelector('#autoreview-reply-text');
  const toneSelect = modal.querySelector('#autoreview-tone-select');
  const regenBtn = modal.querySelector('.autoreview-regenerate');
  const copyBtn = modal.querySelector('.autoreview-copy');

  modal.querySelector('.autoreview-close').onclick = () => modal.remove();
  modal.querySelector('.autoreview-modal-overlay').onclick = () => modal.remove();
  
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(textArea.value);
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        if (copyBtn) copyBtn.textContent = '📋 Copy Reply';
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  
  regenBtn.onclick = async () => {
    const tone = toneSelect.value;
    regenBtn.textContent = '⏳ ...';
    regenBtn.disabled = true;
    try {
      const newReply = await generateAIReply(review, tone);
      textArea.value = newReply;
    } catch (err) {
      textArea.value = getFallbackReply(review.rating, review.author, tone);
    } finally {
      regenBtn.textContent = '🔄 Regenerate';
      regenBtn.disabled = false;
    }
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getReviews') {
    const reviews = scrapeReviews();
    sendResponse({ reviews });
  }
  return true;
});

// Initialize with debounce
let timer;
function debouncedAddButtons() {
  clearTimeout(timer);
  timer = setTimeout(addAIReplyButtons, 500);
}

if (PLATFORM !== 'unknown') {
  console.log(`[AutoReview AI] Detected platform: ${PLATFORM}`);
  
  // Add buttons on page load
  setTimeout(addAIReplyButtons, 2000);
  
  // Watch for new reviews (infinite scroll)
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) debouncedAddButtons();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
