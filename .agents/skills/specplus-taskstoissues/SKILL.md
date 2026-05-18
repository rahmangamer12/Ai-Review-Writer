# SpecKit Plus Tasks To Issues

Use this skill only when the user explicitly asks to create or prepare GitHub issues from a `tasks.md` file.

## Workflow

1. Read the relevant `specs/[feature]/tasks.md`.
2. Group tasks by user story and dependency.
3. Convert each group into a clear GitHub issue title/body.
4. Include acceptance criteria, files likely affected, and verification commands.
5. Do not create issues unless GitHub access is available and the user asked for actual issue creation.

## Guardrails

- Keep issue scope small and independently verifiable.
- Preserve task IDs for traceability.
- Do not include secrets or private environment values.
