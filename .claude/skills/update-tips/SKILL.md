---
name: update-tips
description: Check the Claude Code changelog for releases newer than the tracked version, add tips worth adding to tips.json, fix tips that went stale, rebuild, and open a PR. Use for the weekly maintenance routine or when asked to update the tips.
---

# Update tips

1. Read `trackedClaudeCode` from `tips.json`.
2. Fetch `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` and take every release newer than the tracked version.
3. **Candidates** are user-facing features that change how people work beyond the prompt: new slash commands, hook events or hook options, settings, CLI flags, model aliases, automation. **Ignore** bug fixes, managed/enterprise-only settings, provider-specific items (Bedrock, Vertex, Foundry) and internals.
4. **Stale check:** if a release renames or removes something an existing tip uses, fix or delete that tip.
5. **Verify before writing.** Confirm each candidate on its page under `https://code.claude.com/docs/en/`. No tip without a snippet or command that the docs back up.
6. **Add at most 3 tips per run**, only if they are clearly useful. Match the existing entries:
   - `title` ≤ 6 words, `tip` ≤ 30 words, `when` one short line, `done` states how an audit detects the tip is already applied
   - card lines ≤ 80 characters, ≤ 14 lines; config tips use `snippet` only (the card is generated from it)
   - `added` = today's date
7. Set `trackedClaudeCode` to the newest release you reviewed and `updated` to today. If any tip changed, bump `version`.
8. Run `node scripts/build.mjs` and fix any warnings it prints.
9. If files changed: branch `claude/tips-<newest version>`, commit, open a PR that lists each change with the changelog line and the docs URL behind it. If nothing is worth adding, make no PR; still bump `trackedClaudeCode` in a PR only if more than 10 releases were reviewed.
