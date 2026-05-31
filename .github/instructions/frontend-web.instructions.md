---
description: 'Frontend web rules for a fast, clean, mobile-friendly hackathon UI with minimal complexity'
applyTo: 'frontend/**/*.{html,css,js,ts,jsx,tsx}'
---

# Frontend Web Instructions

## Goals
- Ship quickly with clean UX and minimal code.
- Keep render paths lightweight.

## UI and UX
- Prioritize readability, clear hierarchy, and obvious interactions.
- Ensure responsive behavior for mobile and desktop.
- Use semantic HTML and keyboard-accessible interactions.

## Styling
- Prefer small, composable styles.
- Avoid unused CSS and deep selector nesting.
- Keep design consistent across screens.

## JavaScript and TypeScript
- Keep state and side effects explicit.
- Avoid large utility layers unless needed by repetition.
- Favor straightforward data flow over magic abstractions.

## Validation
- Run Biome checks for changed files.
- Add simple UI tests or interaction checks where practical.
