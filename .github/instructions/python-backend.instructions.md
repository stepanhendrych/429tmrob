---
description: 'Python backend coding rules for the hackathon boilerplate (UV, zero-bloat, fast iteration)'
applyTo: 'backend/**/*.py'
---

# Python Backend Instructions

## Goals
- Keep backend code simple, testable, and fast to iterate.
- Avoid over-engineering.

## Coding Rules
- Use explicit names and focused functions.
- Add type hints to public and non-trivial internal functions.
- Raise specific exceptions with useful messages.
- Avoid global mutable state.

## Dependencies
- Prefer Python standard library first.
- Add third-party packages only when they remove meaningful complexity.
- Keep dependency count low.

## Structure
- Keep modules small and purpose-driven.
- Move shared logic into reusable utility modules only when repeated.

## Validation
- Run Ruff on changed files before finalizing.
- Add tests for changed behavior where practical.
