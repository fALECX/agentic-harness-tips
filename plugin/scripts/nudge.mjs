// SessionStart hook: at most once a day per project, tells the user when tips exist
// that this repo hasn't been audited against. Silent on any error.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TIPS_URL = "https://raw.githubusercontent.com/fALECX/agentic-harness-tips/main/tips.json";
const DAY = 24 * 60 * 60 * 1000;

const readJson = (path) => {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
};

try {
  const project = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

  const throttlePath = dataDir && join(dataDir, "nudged.json");
  const throttle = (throttlePath && readJson(throttlePath)) || {};
  if (Date.now() - (throttle[project] ?? 0) < DAY) process.exit(0);

  let data = null;
  try {
    const res = await fetch(TIPS_URL, { signal: AbortSignal.timeout(3000) });
    if (res.ok) data = await res.json();
  } catch {}
  data ??= pluginRoot && readJson(join(pluginRoot, "skills", "audit", "tips.json"));
  if (!data?.tips?.length) process.exit(0);

  const state = readJson(join(project, ".claude", "harness-tips.json"));
  const seen = new Set([...(state?.seen ?? []), ...(state?.applied ?? []), ...(state?.declined ?? [])]);
  const unseen = data.tips.filter((t) => !seen.has(t.id));
  if (!unseen.length) process.exit(0);

  const message = state
    ? `💡 ${unseen.length} new harness tip${unseen.length > 1 ? "s" : ""} since your last audit (${unseen.slice(0, 3).map((t) => t.title).join(" · ")}${unseen.length > 3 ? " …" : ""}). Run /harness-tips:audit`
    : `💡 This repo hasn't been checked against ${data.tips.length} harness tips yet. Run /harness-tips:audit`;
  console.log(JSON.stringify({ systemMessage: message }));

  if (throttlePath) {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(throttlePath, JSON.stringify({ ...throttle, [project]: Date.now() }));
  }
} catch {
  process.exit(0);
}
