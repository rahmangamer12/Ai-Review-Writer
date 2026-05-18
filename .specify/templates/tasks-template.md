---
description: "AutoReview AI task list template"
---

# Tasks: [FEATURE NAME]

**Input**: `spec.md` and `plan.md` from `specs/[feature]/`
**Goal**: Small, independently verifiable tasks with exact file paths.

## Rules

- Keep tasks scoped to the feature.
- Name the real data source for every user-facing value.
- Do not add demo, placeholder, random, or template production data.
- Do not read broad folders when `rg` can answer the question.
- Mark `[P]` only when tasks touch different files and can run in parallel.
- Include UI loading, empty, error, and success states when UI changes.
- Include auth/ownership checks when user data changes.

## Format

`- [ ] T001 [P] [US1] Update [exact path] to [specific outcome]`

## Phase 1: Context And Contracts

- [ ] T001 Read only the files listed in `plan.md` context budget.
- [ ] T002 Confirm real data source and ownership rules for this feature.
- [ ] T003 Define or update API/request/response contract paths.
- [ ] T004 Identify any Prisma schema or migration impact.

## Phase 2: User Story 1 - [Title] (P1)

**Independent Test**: [How to test this story alone]

- [ ] T005 [US1] Implement backend/data change in [path].
- [ ] T006 [US1] Implement UI/interaction change in [path].
- [ ] T007 [US1] Add loading/empty/error/success states in [path].
- [ ] T008 [US1] Verify ownership/security behavior.

## Phase 3: User Story 2 - [Title] (P2)

**Independent Test**: [How to test this story alone]

- [ ] T009 [US2] Implement backend/data change in [path].
- [ ] T010 [US2] Implement UI/interaction change in [path].
- [ ] T011 [US2] Verify this story without depending on US1 UI state.

## Phase 4: User Story 3 - [Title] (P3)

**Independent Test**: [How to test this story alone]

- [ ] T012 [US3] Implement backend/data change in [path].
- [ ] T013 [US3] Implement UI/interaction change in [path].
- [ ] T014 [US3] Verify this story independently.

## Phase 5: Verification

- [ ] T015 Run `npx tsc --noEmit`.
- [ ] T016 Run `npm run build` when app/runtime behavior changed.
- [ ] T017 Run `git diff --check`.
- [ ] T018 Manually check desktop and mobile responsive behavior if UI changed.
- [ ] T019 Confirm no `.env*` values, secrets, demo metrics, or fake review data were added.

## Notes

- Replace placeholder paths before implementation starts.
- Remove unused user story sections.
- Keep the final task list short enough to scan in one screen.
