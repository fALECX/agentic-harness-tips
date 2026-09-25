---
name: audit
description: Audit the current repository against the Agentic Harness Tips list and propose the hooks, settings, skills and workflows that fit it. Use when the user asks to audit their Claude Code setup, look for automation or efficiency wins, or after the session-start nudge reports new tips.
---

# Harness audit

1. **Load the tips.** Fetch `https://raw.githubusercontent.com/fALECX/agentic-harness-tips/main/tips.json`. If that fails, read `tips.json` in this skill's directory.
2. **Load state.** Read `.claude/harness-tips.json` in the project root if it exists (`{ "tipsVersion": n, "seen": [], "applied": [], "declined": [] }`). Skip tips in `seen` unless the user asks for a full re-audit.
3. **Survey the project, read-only.** Package manifests and scripts, languages, formatters, type-checkers, test commands, CI config, `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/settings.json`, `.claude/skills/`, `.claude/agents/`, `~/.claude/agents/`, git state.
4. **Classify every remaining tip:**
   - **fits**: its `when` matches evidence in this repo
   - **already done**: its `done` check passes
   - **not relevant**: say why in a few words
   Cite evidence as `file` + field or line.
5. **Report.** One table of the tips that fit, highest payoff first: tip, why it fits here, the exact change adapted to this repo (real script names, the formatter it actually uses, correct settings scope). Then one line each for "already done" and "not relevant". Habit tips with no config go in a short "Try this" line.
6. **Apply only what the user picks.** Merge into existing settings JSON and never overwrite existing hooks, permissions or instructions. Put user-level tips (`~/.claude/...`) at user level, project tips in the project. Check that every JSON file still parses.
7. **Record state.** Write `.claude/harness-tips.json`: `tipsVersion`, `seen` (every tip id you classified), `applied`, `declined`. This file stops the session-start nudge from repeating itself.

## Unattended (routine) mode

When no one can answer questions, apply only the tips that fit and only touch project files. Use a `claude/harness-audit-<date>` branch, one commit per tip, and open a PR whose body contains the report from step 5. If nothing fits, open no PR and say so.

## Rules

- Never apply a change without the user's confirmation, except in unattended mode as described above.
- Never read or print secrets. Tips about `.env` files add deny rules; they don't open the files.
- Adapt snippets. A `prettier` hook in a Python repo is wrong; use the repo's own tools.
