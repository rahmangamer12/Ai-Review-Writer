// Bulletproof Background Service Worker

const API_URL = 'https://ai-review-writer.vercel.app/api/reviews/generate-reply';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoReview AI] Extension successfully installed and active!');
  
  // Set default settings
  chrome.storage.sync.set({
    tone: 'friendly',
    language: 'en',
    autoCopy: true,
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // If content script requests popup injection
  if (request.action === 'openPopup') {
    if (chrome.action && chrome.action.openPopup) {
       chrome.action.openPopup().catch(() => console.log('Popup open blocked by browser. User must click manually.'));
    }
  }

  if (request.action === 'generateAIReply') {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.payload || {}),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.error || data.details || `AI server returned ${response.status}`);
        }
        sendResponse({
          success: true,
          reply: data.reply || data.data?.reply,
          metadata: data.metadata || null,
        });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message || 'AI request failed' });
      });
    return true;
  }

  // Always return true for async response channels
  return true; 
});
