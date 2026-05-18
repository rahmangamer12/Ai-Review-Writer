---
name: speckit-plus-autoreview
description: Use AutoReview AI's Spec Kit and SpecKit Plus workflow for specs, plans, tasks, ADRs, prompt history, and reverse engineering.
paths: "specs/**,.specify/**,.agents/**,src/**,chrome-extension/**,prisma/**"
---

# SpecKit Plus For AutoReview

Use this skill for non-trivial features, migrations, production-readiness work, security fixes, billing/OAuth changes, and legacy rewrites.

## Context

Read in this order:

1. `AGENTS.md`
2. `.specify/memory/constitution.md`
3. `.specify/memory/constitutionplus.md`
4. Relevant `specs/[feature]/` files
5. Target source files only

## Workflow

1. Specify: define user goal, source of truth, acceptance criteria, security/privacy, UI states.
2. Plan: map API/data/model/UI changes and verification.
3. Tasks: split into small independently testable tasks.
4. Implement: touch only scoped files.
5. Plus artifacts:
   - ADR for durable architecture decisions.
   - PHR for meaningful work traceability.
   - Reverse-engineering notes before legacy rewrites.

## Commands

- Use `specifyplus`, not `sp`, in PowerShell.
- Set UTF-8 if the banner fails on Windows:
  - `$env:PYTHONIOENCODING='utf-8'`
  - `$env:PYTHONUTF8='1'`
  - `chcp 65001`

## Guardrails

- Keep context small.
- No demo production data.
- No client-side secret/payment storage.
- Update specs when behavior changes.
