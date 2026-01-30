// Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('[AutoReview AI] Extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    tone: 'friendly',
    language: 'en',
    autoCopy: true,
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// Context menu for quick reply
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'autoreview-generate-reply',
    title: '✨ Generate AI Reply',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'autoreview-generate-reply') {
    const selectedText = info.selectionText;
    
    // Store the selected text
    await chrome.storage.local.set({
      quickReplyText: selectedText,
    });
    
    // Open popup
    chrome.action.openPopup();
  }
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 4.9 });
chrome.alarms.onAlarm.addListener(() => {
  console.log('[AutoReview AI] Keep alive');
});
