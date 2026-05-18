---
id: "{{ID}}"
title: "{{TITLE}}"
stage: "{{STAGE}}"
date: "{{DATE_ISO}}"
surface: "agent"
model: "{{MODEL}}"
feature: "{{FEATURE}}"
branch: "{{BRANCH}}"
files:
{{FILES_YAML}}
tests:
{{TESTS_YAML}}
---

# Prompt History Record: {{TITLE}}

## User Goal

{{PROMPT_TEXT}}

## Response Summary

{{RESPONSE_TEXT}}

## Outcome

{{OUTCOME_IMPACT}}

## Verification

{{TESTS_SUMMARY}}

## Files Changed

{{FILES_SUMMARY}}

## Follow-Up

{{NEXT_PROMPTS}}

## Reflection

{{REFLECTION_NOTE}}
