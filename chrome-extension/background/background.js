// Bulletproof Background Service Worker

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
  // Always return true for async response channels
  return true; 
});
