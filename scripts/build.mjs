// Generates README.md, assets/*.svg and the plugin's bundled tips.json from tips.json.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "tips.json"), "utf8"));
const { repo, tips, categories } = data;
const [owner, name] = repo.split("/");

// ------------------------------------------------------------------ SVG cards
const W = 760, BAR = 36, PAD_X = 24, PAD_TOP = 22, PAD_BOTTOM = 20, LINE = 22, MAX_COLS = 80;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shellTokens(line) {
  if (/^\s*#/.test(line)) return [["c", line]];
  const out = [];
  let rest = line;
  const comment = rest.match(/\s+#\s.*$/);
  if (comment) rest = rest.slice(0, comment.index);
  const prompt = rest.match(/^([>$])( .*)?$/);
  if (prompt) {
    out.push([prompt[1] === ">" ? "p" : "g", prompt[1]]);
    rest = prompt[2] ?? "";
  }
  for (const part of rest.split(/(\[[^\]]+\])/)) if (part) out.push([part.startsWith("[") ? "k" : "t", part]);
  if (comment) out.push(["c", comment[0]]);
  return out;
}

function jsonTokens(line) {
  const out = [];
  let last = 0;
  for (const m of line.matchAll(/("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null|\d+)\b/g)) {
    if (m.index > last) out.push(["d", line.slice(last, m.index)]);
    if (m[1]) {
      out.push([m[2] ? "b" : "s", m[1]]);
      if (m[2]) out.push(["d", m[2]]);
    } else out.push(["p", m[0]]);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(["d", line.slice(last)]);
  return out;
}

function mdTokens(lines) {
  let front = false;
  return lines.map((line, i) => {
    if (line === "---") { front = i === 0 ? true : false; return [["c", line]]; }
    if (front) {
      const kv = line.match(/^(\w+):(.*)$/);
      return kv ? [["b", kv[1]], ["d", ":"], ["t", kv[2]]] : [["t", line]];
    }
    if (/^#+ /.test(line)) return [["h", line]];
    if (/^<!--/.test(line)) return [["c", line]];
    if (/^@/.test(line)) return [["k", line]];
    const list = line.match(/^(\s*(?:-|\d+\.))( .*)$/);
    if (list) return [["p", list[1]], ["t", list[2]]];
    return [["t", line]];
  });
}

function card(title, lang, lines, id) {
  for (const l of lines) if ([...l].length > MAX_COLS) console.warn(`! ${id}: line over ${MAX_COLS} cols: ${l}`);
  const tokens = lang === "json" ? lines.map(jsonTokens) : lang === "md" ? mdTokens(lines) : lines.map(shellTokens);
  const H = BAR + PAD_TOP + lines.length * LINE + PAD_BOTTOM;
  const body = tokens
    .map((toks, i) => {
      if (!toks.length || toks.every(([, t]) => !t.trim())) return "";
      const y = BAR + PAD_TOP + 14 + i * LINE;
      return `  <text x="${PAD_X}" y="${y}" xml:space="preserve">${toks.map(([c, t]) => `<tspan class="${c}">${esc(t)}</tspan>`).join("")}</text>`;
    })
    .filter(Boolean)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
  <style>
    text { font: 14px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; white-space: pre; }
    .t { fill: #e6edf3; } .d { fill: #c9d1d9; } .c { fill: #8b949e; } .p { fill: #d97757; font-weight: 700; }
    .g { fill: #7ee787; font-weight: 700; } .k { fill: #d2a8ff; } .b { fill: #79c0ff; } .s { fill: #a5d6ff; }
    .h { fill: #d97757; font-weight: 700; } .bar { font-size: 12px; fill: #8b949e; }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="#0d1117" stroke="#30363d"/>
  <path d="M0.5 ${BAR}V10.5a10 10 0 0 1 10-10h${W - 21}a10 10 0 0 1 10 10V${BAR}z" fill="#161b22"/>
  <line x1="0.5" y1="${BAR}" x2="${W - 0.5}" y2="${BAR}" stroke="#30363d"/>
  <circle cx="20" cy="18" r="6" fill="#ff5f57"/><circle cx="40" cy="18" r="6" fill="#febc2e"/><circle cx="60" cy="18" r="6" fill="#28c840"/>
  <text x="${W / 2}" y="22" text-anchor="middle" class="bar">${esc(title)}</text>
${body}
</svg>
`;
}

const assets = join(root, "assets");
mkdirSync(assets, { recursive: true });
for (const f of readdirSync(assets)) if (f.endsWith(".svg")) rmSync(join(assets, f));

const hero = [
  `> /plugin marketplace add ${repo}`,
  `> /plugin install harness-tips@${name}`,
  "> /harness-tips:audit",
  "",
  "# reads this list, surveys your repo, shows which tips fit,",
  "# skips what you already have, applies the ones you pick",
];
writeFileSync(join(assets, "audit.svg"), card("claude", "shell", hero, "audit"));
for (const t of tips) {
  const c = t.card ?? { title: t.snippet.file, lang: t.snippet.lang, lines: t.snippet.code };
  writeFileSync(join(assets, `${t.id}.svg`), card(c.title, c.lang, c.lines, t.id));
}

// ------------------------------------------------------------------ README
const byCat = categories.map((c) => ({ ...c, tips: tips.filter((t) => t.category === c.id) }));
const md = [];
md.push(
  "# Agentic Harness Tips",
  "",
  "What I set up in Claude Code besides prompting. One tip, one picture, one snippet.",
  "",
  `<sub>${tips.length} tips · tracked through Claude Code ${data.trackedClaudeCode} · updated ${data.updated}</sub>`,
  "",
  "**Check your own repo against this list:**",
  "",
  `<img src="assets/audit.svg" width="760" alt="Install the harness-tips plugin and run /harness-tips:audit">`,
  "",
  "```text",
  ...hero.filter((l) => l.startsWith(">")).map((l) => l.slice(2)),
  "```",
  "",
  "| Tip | When it pays off |",
  "|:--|:--|",
);
for (const c of byCat) {
  md.push(`| **${c.title}** | |`);
  for (const t of c.tips) md.push(`| [${t.title}](#${t.id}) | ${t.when} |`);
}
for (const c of byCat) {
  md.push("", `## ${c.title}`);
  for (const t of c.tips) {
    md.push("", `<a id="${t.id}"></a>`, "", `### ${t.title}`, "", t.tip, "", `<img src="assets/${t.id}.svg" width="760" alt="${t.title}">`, "");
    md.push(`**When:** ${t.when}${t.note ? `  \n**Note:** ${t.note}` : ""}`);
    if (t.snippet) {
      md.push("", `<details><summary>Copy · <code>${t.snippet.file}</code></summary>`, "", "```" + t.snippet.lang, ...t.snippet.code, "```", "", "</details>");
    }
  }
}
const raw = `https://raw.githubusercontent.com/${repo}/main`;
md.push(
  "",
  "## Keep it running",
  "",
  "- **Nudge:** the plugin's session-start hook tells you when tips land that your repo hasn't seen yet.",
  `- **Daily audit as a routine:** \`/schedule daily: fetch ${raw}/plugin/skills/audit/SKILL.md and follow it unattended\``,
  "- **Fresh list:** a daily routine reads the Claude Code changelog, checks new features against the docs and opens a PR here.",
  "",
  "<sub>Source of truth is <code>tips.json</code>. README, images and the plugin copy are generated by <code>node scripts/build.mjs</code>.</sub>",
  "",
);
writeFileSync(join(root, "README.md"), md.join("\n"));

// ------------------------------------------------------------------ plugin copy
writeFileSync(join(root, "plugin", "skills", "audit", "tips.json"), JSON.stringify(data, null, 2) + "\n");

console.log(`built ${tips.length} tips · ${owner}/${name}`);
