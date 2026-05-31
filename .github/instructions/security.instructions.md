---
description: 'Security baseline for code changes in the hackathon project'
applyTo: '**'
---

# Security Instructions

## Input and Data Safety
- Treat all external input as untrusted.
- Validate and sanitize data at boundaries.
- Never trust client-side validation alone.

## Secrets
- Never hardcode secrets, keys, tokens, or passwords.
- Use environment variables or secret stores.
- Avoid logging sensitive values.

## Access and Permissions
- Use least-privilege access patterns.
- Restrict potentially destructive operations.

## Dependencies and Supply Chain
- Prefer stable, maintained packages.
- Avoid adding dependencies with unclear trust or ownership.
