---
name: autoreview-extension-workflow
description: Work on the AutoReview Chrome extension review-detection, popup, AI reply, app URL, logo, and Manifest V3 flows.
paths: "chrome-extension/**,public/**,src/app/api/reviews/**"
---

# AutoReview Extension Workflow

Use this skill for Chrome extension content scripts, popup UI, background worker, icons, review scraping, and AI reply integration.

## Steps

1. Read `chrome-extension/manifest.json`.
2. Inspect only the affected content/background/popup files.
3. Keep DOM scraping defensive because review platform markup changes.
4. Prevent duplicate injected buttons.
5. Support multiple detected reviews with search/navigation where relevant.
6. Call the production web app backend for AI generation; do not use local templates as primary behavior.
7. Use the production app URL unless local development is explicitly requested.

## Verification

- Confirm manifest paths and icons exist.
- Check popup loads without broken script/style paths.
- Check content script does not inject duplicate UI on repeated loads.
- Check AI reply calls backend route with review text and platform context.

## Guardrails

- Do not hardcode secrets in extension files.
- Do not depend on a single brittle selector when safer fallbacks are available.
