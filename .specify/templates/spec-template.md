# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: "$ARGUMENTS"

## Product Goal

[One short paragraph describing what user/business problem this solves.]

## Non-Negotiables

- Uses real user/platform/billing data only.
- No demo, random, placeholder, or hardcoded production metrics.
- Authenticated user data is scoped by server-side ownership checks.
- Secrets, OAuth tokens, API keys, and payment data stay server-side or with trusted providers.
- UI works on mobile and desktop with clear loading, empty, error, and success states.

## User Stories

### US1 - [Title] (P1)

[Plain-language journey.]

**Why P1**: [Value]
**Independent Test**: [Specific test action and expected value]

**Acceptance Criteria**:

1. Given [state], when [action], then [result].
2. Given [state], when [action], then [result].

### US2 - [Title] (P2)

[Plain-language journey.]

**Why P2**: [Value]
**Independent Test**: [Specific test action and expected value]

**Acceptance Criteria**:

1. Given [state], when [action], then [result].

### US3 - [Title] (P3)

[Plain-language journey.]

**Why P3**: [Value]
**Independent Test**: [Specific test action and expected value]

**Acceptance Criteria**:

1. Given [state], when [action], then [result].

## Functional Requirements

- **FR-001**: The system MUST [specific behavior].
- **FR-002**: The system MUST [specific behavior].
- **FR-003**: The system MUST persist/read [data] from [real source].
- **FR-004**: The system MUST show a useful empty state when [condition].
- **FR-005**: The system MUST show a useful error state when [condition].

## Data And Ownership

| Data | Source of truth | Ownership/security rule |
|------|-----------------|-------------------------|
| [data] | [Prisma/Clerk/provider/etc.] | [rule] |

## Edge Cases

- [Boundary condition]
- [Provider/API failure]
- [Unauthorized or wrong-user access]
- [Empty data]
- [Slow network/loading]

## Success Criteria

- **SC-001**: [Measurable user outcome]
- **SC-002**: [Measurable reliability/security outcome]
- **SC-003**: [Measurable UX/performance outcome]

## Assumptions

- [Reasonable default chosen because user did not specify]

## Out Of Scope

- [What this feature will not do]
