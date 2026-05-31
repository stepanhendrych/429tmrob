  # GitHub Copilot Instructions

  ## Project Context
  - **Hackathon Mode:** Prioritize working features over perfect architecture. "Done and working" is better than "Perfect and not working".
  - **Execution Speed:** Decisions must prioritize reducing time-to-first-feature.

  ## Repository & Workflow Rules
  - **Tooling Enforcement:**
      - **Python:** Use `uv` for all operations. Do not suggest `pip` or others manually.
      - **Linting:** Before finalizing any PR/commit, verify via `ruff check --fix` (backend) and `biome check --write` (frontend).
  - **Modification Scope:** 
      - **Surgical Changes:** Only modify the exact lines needed for the current task. If an unrelated file is touched, revert it immediately.
      - **No "Over-Engineering":** If a solution requires more than 50 lines of new code, pause and suggest a simpler approach.

  ## Repository Layout
  - backend/: Python service and scripts (UV-managed)
  - frontend/: Web UI
  - .github/: Copilot instructions, agents, prompts, skills

  ## Core Principles
  - Keep changes surgical. Do not refactor unrelated code.
  - Prefer simple, proven solutions over clever abstractions.
  - Minimize dependencies. Add a dependency only when it is clearly justified.
  - Preserve startup speed and developer speed.

  ## Backend Standards
  - Use Python with clear type hints for non-trivial functions.
  - Prefer pure functions and small modules.
  - Keep side effects explicit.
  - Use UV workflows for Python commands and dependency changes.

  ## Frontend Standards
  - Keep UI fast and readable on desktop and mobile.
  - Avoid heavy frameworks unless explicitly requested.
  - Favor accessibility and clear semantic HTML.

  ## Quality Gates
  - Backend lint/format: Ruff.
  - Frontend lint/format: Biome.
  - Add or update tests for changed behavior when practical.

  ## Change Discipline
  - If scope is unclear, ask one focused question.
  - If constraints conflict, choose the minimal-risk path and explain tradeoffs.
  - Never introduce hidden breaking changes.