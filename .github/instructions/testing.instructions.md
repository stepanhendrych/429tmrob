---
description: 'Testing rules for fast, reliable confidence in backend and frontend changes'
applyTo: 'backend/tests/**/*.py, backend/**/*test*.py, frontend/**/*.{test,spec}.{js,jsx,ts,tsx}'
---

# Testing Instructions

## Strategy
- Test behavior, not implementation details.
- Keep tests fast and deterministic.
- Focus first on critical paths.

## Backend
- Prefer pytest-style concise tests.
- Cover success path, one edge case, and one failure mode for new logic.

## Frontend
- Test key interactions and user-visible outcomes.
- Keep test setup minimal and explicit.

## Scope Discipline
- Do not create broad snapshot-only suites.
- Add only tests that guard real regression risk.
