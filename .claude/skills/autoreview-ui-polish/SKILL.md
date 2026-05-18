---
name: autoreview-ui-polish
description: Improve AutoReview AI UI with responsive layouts, usable states, lucide icons, no emoji placeholders, and production SaaS polish.
paths: "src/app/**,src/components/**,src/styles/**"
---

# AutoReview UI Polish

Use this skill for dashboard, reviews, analytics, profile, settings, platforms, billing, chat, and mobile UI work.

## Standards

- Build the working product surface, not marketing filler.
- Use `lucide-react` icons for actions, settings, tabs, and compact controls.
- Avoid emoji in product UI unless explicitly requested.
- Cards are for repeated items, modals, or framed tools; avoid nested card clutter.
- Provide loading, empty, error, and success states.
- Mobile nav and critical actions must remain reachable.
- Text must not overflow buttons, cards, or badges.
- Empty states must point to the next real action.

## Checks

- Search existing patterns before creating new components.
- Verify mobile and desktop behavior for touched pages.
- Confirm data shown is real or an honest empty state.
- Run `npx tsc --noEmit` for code changes.

## Output

Summarize visual/UX changes, responsive checks, and remaining risks.
