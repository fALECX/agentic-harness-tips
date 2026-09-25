# agentic-harness-tips

A short, visual list of Claude Code setup tips, plus a plugin that audits other repos against it.

## Source of truth

- `tips.json` holds every tip. Edit only this file.
- `node scripts/build.mjs` regenerates `README.md`, `assets/*.svg` and `plugin/skills/audit/tips.json`. Never edit those by hand.
- Run the build after every change to `tips.json` and commit the generated files with it.

## Layout

- `plugin/`: the `harness-tips` plugin (`/harness-tips:audit` skill, session-start nudge hook)
- `.claude-plugin/marketplace.json`: makes this repo installable as a plugin marketplace
- `.claude/skills/update-tips/`: maintenance skill that the weekly routine runs

## Rules

- A tip must be short, verified against the official docs, and ship a working snippet or command.
- README text stays in English and minimal: no intro essays, only tips.
- Validate the plugin after touching `plugin/` or `.claude-plugin/`: `claude plugin validate .`
