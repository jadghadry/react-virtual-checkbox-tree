// Fails if the API reference has drifted from the source.
//
// The props table on /docs/api/tree and the method tables on /docs/api/engine
// are handwritten, because a generated table sorts alphabetically and buries
// `data` under `aria-label`, and because the semantics that matter ("checked
// **leaf** ids — folder ids are ignored") don't come from a type. Handwritten
// tables rot, so this is the guard that stops them.
//
//   node scripts/check-docs-drift.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lib = join(root, "packages", "react-virtual-checkbox-tree", "src");
const docs = join(root, "apps", "web", "app", "docs");

const problems = [];

/** Pulls the member names out of a `type X = { ... }` or `class X { ... }` block. */
function membersOf(source, header, { methods = false } = {}) {
  const start = source.indexOf(header);
  if (start === -1) throw new Error(`Could not find "${header}" — did it get renamed?`);

  let i = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = source.slice(start, end);

  const names = new Set();
  const pattern = methods
    ? /^\s{2}(?!\/|\*|private |static )([A-Za-z][A-Za-z0-9_]*)\s*\(/gm
    : /^\s{2}(?:"([^"]+)"|([A-Za-z][A-Za-z0-9_]*))\??\s*:/gm;

  for (const match of body.matchAll(pattern)) {
    names.add(match[1] ?? match[2]);
  }
  return names;
}

function check(label, names, docPath, { ignore = [] } = {}) {
  const page = readFileSync(docPath, "utf8");
  const missing = [...names].filter((name) => {
    if (ignore.includes(name)) return false;
    // A member counts as documented if it appears anywhere on the page — in a
    // table cell, a heading, or a code example.
    return !new RegExp(`\\b${name.replace(/[^\w-]/g, "\\$&")}\\b`).test(page);
  });
  if (missing.length) {
    problems.push(
      `${label}: ${missing.length} member(s) not documented in ${docPath.replace(root + "/", "")}\n` +
        missing.map((m) => `    - ${m}`).join("\n")
    );
  } else {
    console.log(`  ok  ${label} — ${names.size} members, all documented`);
  }
}

const treeSource = readFileSync(join(lib, "tree.tsx"), "utf8");
const engineSource = readFileSync(join(lib, "engine.ts"), "utf8");
const typesSource = readFileSync(join(lib, "types.ts"), "utf8");

console.log("Checking API reference against source…");

check("TreeProps", membersOf(treeSource, "export type TreeProps = "), join(docs, "api/tree/page.mdx"));
check("TreeRef", membersOf(treeSource, "export type TreeRef = "), join(docs, "api/tree/page.mdx"));
check(
  "Engine (public methods)",
  membersOf(engineSource, "export class Engine", { methods: true }),
  join(docs, "api/engine/page.mdx"),
  { ignore: ["constructor"] }
);
check("TreeItem", membersOf(typesSource, "export type TreeItem = "), join(docs, "api/types/page.mdx"));
check("VisibleItem", membersOf(typesSource, "export type VisibleItem = "), join(docs, "api/types/page.mdx"));
check(
  "TreeCheckboxRenderProps",
  membersOf(treeSource, "export type TreeCheckboxRenderProps = "),
  join(docs, "api/types/page.mdx")
);
check(
  "TreeExpanderRenderProps",
  membersOf(treeSource, "export type TreeExpanderRenderProps = "),
  join(docs, "api/types/page.mdx")
);
check(
  "TreeItemRenderProps",
  membersOf(treeSource, "export type TreeItemRenderProps = "),
  join(docs, "api/types/page.mdx")
);

if (problems.length) {
  console.error("\nAPI reference has drifted from the source:\n");
  console.error(problems.join("\n\n"));
  console.error("\nDocument the members above, or remove them from the public API.");
  process.exit(1);
}

console.log("\nAPI reference is in sync.");
