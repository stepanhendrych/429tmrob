# Skill: affine-secret-name-check

## Purpose

Keep local `.env` secret key names aligned with the AFFiNE document `SECRETS + INTERNET`.
This is a review-first workflow: compare, report, and only propose changes after explicit confirmation.

## When to use

- You want to check that new `.env` keys follow the existing naming convention.
- You want to see which services exist in `.env` but are missing in AFFiNE.
- You want to detect AFFiNE rows that no longer have a matching local key.

## Inputs

- Local `.env` file, defaulting to `.env`.
- AFFiNE document title `SECRETS + INTERNET`.
- Optional exported AFFiNE table if the live document cannot be read directly.

## Execution rules

- Run the helper from the repo root with `uv run python .github/skills/affine-secret-name-check/sync_secrets.py`.
- Do not install Python packages globally.
- If a dependency is ever required, add it locally with `uv`; never use `pip` or a global package install for this skill.
- Prefer zero extra dependencies; this skill should work with the standard library only.

## Available AFFiNE tools

- `mcp_affine-429tmr_keyword_search`
- `mcp_affine-429tmr_read_document`
- `mcp_affine-429tmr_semantic_search`

## Validation rules

- Treat a key as valid when it is uppercase, underscore-separated, and contains at least two segments: `^[A-Z0-9]+(?:_[A-Z0-9]+)+$`.
- Normalize for comparison only. Do not rewrite `.env` unless the user explicitly approves it.
- Never copy secret values into AFFiNE, logs, or summaries. Use `<redacted>` when an example value is needed.

## Workflow

1. Read `.env` and collect non-empty, non-comment keys.
2. Search AFFiNE for `SECRETS + INTERNET`. If multiple documents match, prefer the exact title.
3. Read the document body and extract the first structured table.
4. Compare rows and keys using the service prefix heuristic. Default to the first segment before `_`; if that is ambiguous, ask the user instead of guessing.
5. Report three buckets: env-only keys, AFFiNE-only rows, and keys that look malformed.
6. For each missing service row, propose a friendly display name, an example env key, and a link only if it can be inferred safely from a URL value.
7. Summarize the findings and wait for confirmation before any write or edit action.
8. If no AFFiNE write API is available, output a paste-ready manual edit instead of pretending to sync automatically.

## Helper script

Use `uv run python sync_secrets.py` for a local dry-run report. It should parse `.env`, optionally read an exported AFFiNE markdown table, and print mismatches without exposing secret values.

## Example

- Local key: `EXAMPLE_KEY_VALUE_NAME=foo@example.com`
- AFFiNE row: `Example Creds | EXAMPLE_KEY_VALUE | https://example.com`

Expected behavior:

- Treat `EXAMPLE` as the service prefix.
- Propose a missing AFFiNE row when the service is absent.
- Ask for a link only when it cannot be inferred safely.

End.
