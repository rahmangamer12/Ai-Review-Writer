# Context Engineering And Token Optimization

This guide keeps AI work fast, cheap, and accurate.

## Goal

Reduce token usage while improving output quality by giving AI agents the right context, in the right order, at the smallest useful size.

## Context Loading Order

1. `AGENTS.md`
2. `.specify/memory/constitution.md`
3. Relevant feature spec in `specs/`
4. API contracts or data model for the feature
5. Target source files
6. Tests/build output only when needed

## Token Budget Rules

- First pass: stay under 3-5 focused files.
- Prefer search results over full file reads.
- Prefer 80-160 line ranges over entire files.
- Summarize findings before opening more files.
- Do not read `node_modules`, `.next`, lockfiles, generated assets, or build artifacts unless directly debugging them.
- Do not paste `.env` content into prompts or reports.

## Search Patterns

Use these before reading files:

```powershell
rg --files src app chrome-extension prisma
rg -n "functionName|routeName|componentName" src
rg -n "localStorage|supabase|Math.random|demo|fake|placeholder" src
rg -n "auth\\(|clerk|userId|prisma" src/app/api
```

## Working Summary Pattern

Agents should keep a compact summary:

```md
## Known
- ...

## Files Read
- path: reason

## Decision
- ...

## Next
- ...
```

## Spec Compression

Feature specs should be precise but not verbose. Keep:

- 3-5 user stories max for one feature slice
- Acceptance criteria as bullet scenarios
- API contract tables instead of long prose
- Real data source named explicitly
- Out-of-scope items listed briefly

## Anti-Patterns

- Reading the whole project before making a small change
- Reopening the same file repeatedly without notes
- Adding fake data to make UI look complete
- Implementing outside the spec
- Using broad abstractions before local patterns are understood
- Letting generated output dominate context

## Done Criteria

- Agent can explain which files mattered and why.
- The feature maps to acceptance criteria.
- Verification output is summarized, not pasted wholesale.
- No unnecessary large context was loaded.
