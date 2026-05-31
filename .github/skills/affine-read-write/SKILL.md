# Skill: affine-read-write

Purpose
-------
This skill provides a safe, auditable pattern for reading and (optionally) writing structured data into AFFiNE documents. It is intended to be used by agents or small CLI tools that need to:

- enumerate AFFiNE documents,
- parse and extract structured tables or key/value lists,
- propose and (with explicit user confirmation) apply changes back into AFFiNE.

Quick verification (keyword search)
----------------------------------
Run a broad keyword search first to verify the keyword-search tool is a reliable way to list documents. Example (the agent should call):

- `mcp_affine-429tmr_keyword_search(query)`

This confirms the keyword-search call is a workable way to enumerate documents for our workspace. Your results will of course vary by AFFiNE workspace/permissions.

Behavior / Algorithm
--------------------
1. Discovery (dry-run):
   - Call `mcp_affine-429tmr_keyword_search` with a query or set of queries (e.g. broad common terms, or paged queries) to gather candidate documents.
   - For each returned docId/title call `mcp_affine-429tmr_read_document(docId)` to fetch the body for parsing.
2. Parsing:
   - Attempt to detect structured content (tables, YAML/frontmatter, key:value lists) using heuristics.
   - Extract rows of interest (e.g., DisplayName / EnvKeyExample / Link) into a local in-memory representation.
3. Analysis / Proposal:
   - Compare extracted AFFiNE rows with the local source of truth (for instance `.env`) or other data sources.
   - Build a list of proposed changes (add, update, deprecate) but do not apply them yet.
4. Confirmation:
   - Present a concise summary to the human user with options: `apply all`, `apply selected`, `export patch`, `abort`.
5. Apply (explicit):
   - If the user confirms, call the AFFiNE write API (if available via the mcp tools) or emit a precise patch/CSV that the user can paste into AFFiNE.

First-run full crawl & caching (recommended enhancement)
------------------------------------------------------
To make the skill efficient and robust, implement a first-run crawler that walks all discovered documents and stores a compact index/cache. Recommended design:

- Cache location (workspace): `.affine-cache/metadata.json` (or `.github/affine-cache.json`). Keep cache small and non-sensitive.
- Cache content (per document): { docId, title, excerpt, detected_tables: [{tableId, columns, rows_count}], lastFetchedAt, contentHash }
- On subsequent runs:
  - Use the cache to avoid re-reading unchanged documents. Compare `contentHash` or `lastModified` if the AFFiNE API provides it.
  - For changed documents fetch and re-parse only those.

Benefits:
- Fast dry-runs and interactive reports.
- Ability to do offline diffs and generate patches without repeated remote calls.

Security and privacy
--------------------
- Never store secret values in cache. Only store metadata and redacted examples (e.g. `<redacted>`).
- Protect the cache in `.gitignore` (add `.affine-cache/` to `.gitignore`).
- Require explicit user consent before performing writes.

Suggested folder contents (place alongside `SKILL.md`)
----------------------------------------------------
- `SKILL.md` — this document (required).
- `affine_read_write.py` — a small executable implementation (dry-run + apply modes). Prefer Python for easy parsing.
- `README.md` — how to run the script and examples.
- `example.env` — example input for testing (no secrets).
- `tests/` — basic unit tests for the parser and cache logic.
- `.affine-cache/` — runtime cache (gitignored).

Pseudocode example (discovery + read):

```
# 1) discovery
docs = mcp_affine_429tmr_keyword_search(query='')
print(f'Found {len(docs)} documents')

# 2) read and parse
for d in docs:
    body = mcp_affine_429tmr_read_document(d.docId)
    tables = parse_tables(body)
    save_metadata(d.docId, d.title, tables)
```

Operational notes
-----------------
- Pagination & rate limits: if `mcp_affine-429tmr_keyword_search` supports paging use it. If not, run multiple queries with different common keywords to increase coverage.
- Permissions: the agent will only see documents available to the authenticated user. The skill must handle auth failures gracefully.
- Testing: always run the skill in `dry-run` mode first to ensure no accidental writes.

Example prompts to invoke this skill
----------------------------------
- "Run a dry-run discovery and report how many AFFiNE docs match 'SECRETS' and extract any tables." 
- "Crawl AFFiNE and build a local cache; then show proposed rows missing from `.env`."

Next improvements / extensions
----------------------------
1. Add a small web UI to review proposed patches before applying.
2. Use a vector-based index (semantic search) for better document discovery and to locate relevant passages inside long docs.
3. Store change history (who approved what) in the cache to support audits.

End of SKILL.md
