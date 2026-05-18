---
name: autoreview-release-verify
description: Verify AutoReview AI before commit, push, or Vercel deploy with focused checks, build/typecheck, secret hygiene, and git status.
disable-model-invocation: true
---

# AutoReview Release Verify

Use this skill when the user asks to push, deploy, final-check, or confirm production readiness.

## Run

For docs-only changes:

- `git diff --check`
- relevant JSON/markdown validation if applicable

For code changes:

- `npx tsc --noEmit`
- `npm run build` for release-level changes
- `git diff --check`
- targeted manual/API check when practical

For security scan:

- `rg -n "NEXT_PUBLIC_.*SECRET|client_secret|access_token|refresh_token|cardNumber|cvv" src chrome-extension`
- `git status --short --branch`

## Report

- What changed
- What passed
- What was skipped and why
- Commit hash and push status

## Guardrails

- Never print `.env` values.
- Do not push if unrelated unexpected changes appear unless they are understood and intentionally included.
