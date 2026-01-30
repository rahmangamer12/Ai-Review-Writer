# AutoReview AI - Chrome Extension

This Chrome Extension allows you to generate AI-powered replies to reviews directly from Google Maps, Facebook, Yelp, and other platforms.

## Features

- 🔍 **Auto-detect reviews** on supported platforms
- ✨ **One-click AI reply generation**
- 🌐 **Multi-language support** (English, Urdu, Roman Urdu, Hindi, Arabic, etc.)
- 🎭 **Multiple tones** (Friendly, Professional, Apologetic, Enthusiastic, Desi)
- 📋 **Auto-copy to clipboard**
- 🔄 **Regenerate replies** if not satisfied

## Supported Platforms

- ✅ Google Maps / Google My Business
- ✅ Facebook Business Pages
- ✅ Yelp
- ✅ TripAdvisor
- ✅ Trustpilot

## Installation

### Method 1: Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search "AutoReview AI"
3. Click "Add to Chrome"

### Method 2: Developer Mode (Current)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Extension is now installed!

## Usage

### From Popup:
1. Navigate to a review page (Google Maps, Facebook, etc.)
2. Click the AutoReview AI extension icon
3. The extension will detect reviews on the page
4. Configure tone and language settings
5. Click "Generate AI Reply"
6. Copy the generated reply and paste on the platform

### From Page (Content Script):
1. Look for the "✨ AI Reply" button on each review
2. Click the button
3. A modal will open with the AI-generated reply
4. Edit if needed, then copy and paste

### Quick Reply (Context Menu):
1. Select any review text on a page
2. Right-click and select "✨ Generate AI Reply"
3. The popup will open with a reply for the selected text

## Configuration

Click the extension icon and configure:

- **Tone**: Friendly, Professional, Apologetic, Enthusiastic, Desi
- **Language**: English, Urdu, Roman Urdu, Hindi, Arabic, Spanish
- **Auto-copy**: Automatically copy replies to clipboard

## Development

### Project Structure
```
chrome-extension/
├── manifest.json       # Extension manifest
├── popup/             # Popup UI
│   ├── popup.html
│   └── popup.js
├── content/           # Content scripts
│   ├── scraper.js     # Review scraping logic
│   └── styles.css     # UI styles
├── background/        # Service worker
│   └── background.js
└── icons/            # Extension icons
```

### API Integration

The extension connects to your AutoReview AI backend:

```javascript
const API_BASE_URL = 'https://autoreview-ai.com';
// For local testing:
// const API_BASE_URL = 'http://localhost:3000';
```

### Building Icons

Create icons in these sizes:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

Place them in the `icons/` folder.

## Troubleshooting

### Extension not detecting reviews?
- Refresh the page
- Make sure you're on a supported platform
- Check if the review is fully loaded (scroll to it)

### API errors?
- Check your internet connection
- Verify the API_BASE_URL is correct
- Check browser console for error details

### Reply not copying?
- Make sure "Auto-copy" is enabled in settings
- Try manually copying from the modal

## Privacy

- The extension only reads review content when you click the AI Reply button
- No personal data is collected
- Review data is sent to your AutoReview AI backend for processing

## License

Part of AutoReview AI SaaS product.
