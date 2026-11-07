#!/usr/bin/env node
// Dependency Scanner — Platform Digital Twin (Epic 2B)
// Parses real imports in the monolith, builds the file/dependency graph, and
// reports circular dependencies. No code is modified; this only reads source.
//
// Usage:  node scan-deps.mjs [rootDir] [rootDir...]
// Writes: DEPENDENCY_GRAPH.md (real module graph + circular-dependency report)

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";

const ROOTS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["app", "lib", "components", "scripts", "middleware.ts"];
const REPO = process.cwd();
const EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];
const IGNORE = new Set(["node_modules", ".next", ".git", "admin-page-backups"]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE.has(e)) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (EXT.includes(p.slice(p.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

function resolveFile(spec, fromDir) {
  let base;
  if (spec.startsWith("@/")) base = join(REPO, spec.slice(2));
  else if (spec.startsWith("~/")) base = join(REPO, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(fromDir, spec);
  else return null; // external package
  const cands = [base, ...EXT.map((x) => base + x), ...EXT.map((x) => join(base, "index" + x))];
  for (const c of cands) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {}
  }
  return null;
}

const IMPORT_RE =
  /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function moduleKey(file) {
  const rel = relative(REPO, file).split(sep);
  // app/api/admin/dispatch/route.ts  -> app/api/admin/dispatch
  // lib/services/booking-service.ts  -> lib/services/booking
  // lib/db.ts                         -> lib/db
  // app/admin/dispatch/page.tsx       -> app/admin/dispatch
  if (rel[0] === "app" && rel[1] === "api") {
    const i = rel.findIndex((x) => x === "route.ts");
    return rel.slice(0, i >= 0 ? i : rel.length).join("/");
  }
  if (rel[0] === "lib" && (rel[1] === "services" || rel[1] === "admin" || rel[1] === "db")) {
    const name = rel[2]?.replace(/\.(ts|tsx|js)$/, "") ?? "";
    return `${rel[0]}/${rel[1]}/${name.replace(/-service$/, "").replace(/-api$/, "")}`;
  }
  // strip filename for page/component trees
  const last = rel[rel.length - 1];
  if (last && (last.startsWith("page.") || last.startsWith("route.") || last.startsWith("layout.")))
    return rel.slice(0, -1).join("/") || rel.join("/");
  if (rel.length >= 2 && (rel[1] === "components" || rel[1] === "hooks"))
    return rel.slice(0, -1).join("/") || rel.join("/");
  return rel.slice(0, -1).join("/") || rel.join("/");
}

const files = new Set();
for (const r of ROOTS) {
  if (r.endsWith(".ts") || r.endsWith(".tsx")) {
    try {
      statSync(r).isFile() && files.add(resolve(REPO, r));
    } catch {}
  } else for (const f of walk(r)) files.add(resolve(REPO, f));
}

const abs = [...files];
const id = new Map(abs.map((f, i) => [f, i]));
const adj = abs.map(() => []);
const moduleOf = abs.map((f) => moduleKey(f));
const moduleIds = new Map();
moduleOf.forEach((m) => {
  if (!moduleIds.has(m)) moduleIds.set(m, moduleIds.size);
});

for (const f of abs) {
  let src;
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const dir = dirname(f);
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const spec = m[1] || m[2] || m[3];
    if (!spec) continue;
    const tgt = resolveFile(spec, dir);
    if (tgt && id.has(tgt)) adj[id.get(f)].push(id.get(tgt));
  }
}

// Tarjan SCC for circular dependency detection
const N = abs.length;
const idx = new Array(N).fill(-1);
const low = new Array(N).fill(0);
const onStack = new Array(N).fill(false);
const stack = [];
let tick = 0;
const sccs = [];
function strong(v) {
  idx[v] = low[v] = ++tick;
  stack.push(v);
  onStack[v] = true;
  for (const w of adj[v]) {
    if (idx[w] === -1) {
      strong(w);
      low[v] = Math.min(low[v], low[w]);
    } else if (onStack[w]) {
      low[v] = Math.min(low[v], idx[w]);
    }
  }
  if (low[v] === idx[v]) {
    const comp = [];
    let w;
    do {
      w = stack.pop();
      onStack[w] = false;
      comp.push(w);
    } while (w !== v);
    sccs.push(comp);
  }
}
for (let v = 0; v < N; v++) if (idx[v] === -1) strong(v);

const cycles = sccs.filter((c) => c.length > 1);
const selfLoops = sccs.filter((c) => c.length === 1 && adj[c[0]].includes(c[0]));

// module-level graph
const mAdj = [];
for (let i = 0; i < moduleIds.size; i++) mAdj.push(new Set());
for (let v = 0; v < N; v++)
  for (const w of adj[v]) {
    const a = moduleIds.get(moduleOf[v]);
    const b = moduleIds.get(moduleOf[w]);
    if (a !== b) mAdj[a].add(b);
  }
// module SCC
const MN = moduleIds.size;
const midx = new Array(MN).fill(-1);
const mlow = new Array(MN).fill(0);
const monS = new Array(MN).fill(false);
const mstack = [];
let mt = 0;
const msccs = [];
function mstrong(v) {
  midx[v] = mlow[v] = ++mt;
  mstack.push(v);
  monS[v] = true;
  for (const w of mAdj[v]) {
    if (midx[w] === -1) {
      mstrong(w);
      mlow[v] = Math.min(mlow[v], mlow[w]);
    } else if (monS[w]) mlow[v] = Math.min(mlow[v], midx[w]);
  }
  if (mlow[v] === midx[v]) {
    const comp = [];
    let w;
    do {
      w = mstack.pop();
      monS[w] = false;
      comp.push(w);
    } while (w !== v);
    msccs.push(comp);
  }
}
for (let v = 0; v < MN; v++) if (midx[v] === -1) mstrong(v);
const modCycles = msccs.filter((c) => c.length > 1);
const modNames = [...moduleIds.keys()];

// degree stats
const indeg = new Array(N).fill(0);
for (let v = 0; v < N; v++) for (const w of adj[v]) indeg[w]++;
const topDeps = abs
  .map((f, i) => ({ f, out: adj[i].length, inn: indeg[i] }))
  .sort((a, b) => b.out + b.inn - (a.out + a.inn))
  .slice(0, 25);

const rel = (f) => relative(REPO, f);

let md = `# DEPENDENCY_GRAPH (real, generated by scan-deps.mjs)\n\n`;
md += `> **Machine-generated mirror of the current monolith.** Source: \`app/\`, \`lib/\`, \`components/\`, \`scripts/\`, \`middleware.ts\`.\n`;
md += `> Run \`node DEPENDENCIES/scan-deps.mjs\` to regenerate. This is evidence for the Digital Twin — not the ideal target.\n\n`;
md += `## Summary\n`;
md += `- Source files scanned: **${N}**\n`;
md += `- Logical modules: **${MN}**\n`;
md += `- Internal dependency edges: **${adj.flat().length}**\n`;
md += `- **Circular dependencies (files): ${cycles.length} cycle(s) / ${selfLoops.length} self-loop(s)**\n`;
md += `- **Circular dependencies (modules): ${modCycles.length} cycle(s)**\n\n`;

md += `## Circular dependencies — MODULES (resolve before 2C)\n`;
if (modCycles.length === 0) md += `_None detected._\n`;
else
  for (const c of modCycles) {
    md += `- \`${c.map((i) => modNames[i]).join(" → ")} → (cycle)\`\n`;
  }
md += `\n`;

md += `## Circular dependencies — FILES\n`;
if (cycles.length === 0 && selfLoops.length === 0) md += `_None detected._\n`;
else {
  let k = 1;
  for (const c of cycles) {
    md += `### Cycle ${k++} (${c.length} files)\n`;
    md += c.map((i) => `- \`${rel(abs[i])}\``).join("\n") + "\n\n";
  }
  for (const c of selfLoops) md += `- **Self-loop:** \`${rel(abs[c[0]])}\`\n`;
}
md += `\n`;

md += `## Most connected files (hubs)\n`;
md += `| File | Out | In |\n|---|---|---|\n`;
for (const r of topDeps) md += `| \`${rel(r.f)}\` | ${r.out} | ${r.inn} |\n`;
md += `\n`;

md += `## Module map (module → depends on)\n`;
md += `| Module | Depends on |\n|---|---|\n`;
const modDeps = modNames.map((name, i) => ({
  name,
  deps: [...mAdj[i]].map((j) => modNames[j]),
}));
for (const r of modDeps.sort((a, b) => b.deps.length - a.deps.length))
  md += `| \`${r.name}\` | ${r.deps.map((d) => "`" + d + "`").join(", ") || "—"} |\n`;

writeFileSync(join(REPO, "docs/platform/99-analysis/platform-digital-twin/DEPENDENCIES/DEPENDENCY_GRAPH.md"), md);
console.log("Wrote DEPENDENCY_GRAPH.md");
console.log("files:", N, "modules:", MN, "file-cycles:", cycles.length, "module-cycles:", modCycles.length);
