---
name: zero-bloat-check
description: "Quick quality gate to keep changes minimal, dependency-light, and regression-safe."
---

# ⚡ Zero Bloat: AI-Native Checklist

Use this checklist for rapid code review before commits or PRs.

## System Prompt for AI

"Perform a 'Zero Bloat' review of the changes in file `X`. Focus on minimalism and performance. If an issue is found, do not propose a full refactor; provide only the minimal diff required to fix the specific issue."

## Checklist

1. **Minimalism:** Can the task be solved using existing code/utilities instead of adding a new dependency?
2. **Cognitive Load:** Is the implementation simple enough to be understood at a glance? If not, simplify.
3. **Ghost Code:** Are there unused imports, dead functions, or redundant variables?
4. **Secret Leak:** Does the diff contain hardcoded keys, URLs, or sensitive data?
5. **Hot Path:** Is this code in a high-frequency execution path? If yes, is the path optimized?

## AI Output Format

- **Status:** [PASS/FAIL]
- **Bloat Index:** [1-10] (1 = minimalist, 10 = spaghetti code)
- **Min-Fix:** (If FAIL, provide only the 1-3 line diff that fixes the issue)
