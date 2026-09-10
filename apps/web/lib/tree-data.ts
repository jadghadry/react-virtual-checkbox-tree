import type { TreeDefinition } from "react-virtual-checkbox-tree";

/**
 * Deterministic PRNG. A 100,000-node tree as JSON is ~6 MB; generated from a
 * seed it costs ~400 bytes of JavaScript and builds in well under a frame.
 * Deterministic so the server and client agree.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS = [
  "components", "hooks", "utils", "lib", "services", "models", "api", "config",
  "styles", "assets", "tests", "scripts", "types", "workers", "adapters",
  "domain", "infra", "features", "widgets", "layouts",
];

const FILES = [
  "index", "client", "server", "helpers", "constants", "schema", "resolver",
  "provider", "context", "reducer", "selectors", "actions", "queries",
  "mutations", "validators", "formatters", "parser", "logger", "cache", "store",
];

const EXTS = [".ts", ".tsx", ".css", ".json", ".md", ".test.ts"];

export type GeneratedTree = {
  data: TreeDefinition;
  folderCount: number;
  leafCount: number;
  nodeCount: number;
};

/**
 * Builds a plausible source tree with roughly `targetNodes` nodes.
 *
 * Shape matters as much as size: a realistically lumpy tree (a few very wide
 * folders, some deep chains) exercises the engine the way real data does, where
 * a perfectly balanced one hides the interesting cases.
 */
export function generateTree(targetNodes: number, seed = 42): GeneratedTree {
  const rand = mulberry32(seed);
  const data: TreeDefinition = {
    __root__: { id: "__root__", label: "root", children: [] },
  };

  let counter = 0;
  let leafCount = 0;
  let folderCount = 0;
  const maxDepth = 6;

  const queue: Array<{ id: string; depth: number }> = [];
  const rootChildren: string[] = [];

  const topLevel = Math.min(12, Math.max(3, Math.round(Math.log10(targetNodes) * 3)));
  for (let i = 0; i < topLevel; i++) {
    const id = `n${counter++}`;
    const label = `${DIRS[i % DIRS.length]}`;
    data[id] = { id, label, children: [], data: { kind: "dir" } };
    rootChildren.push(id);
    queue.push({ id, depth: 1 });
    folderCount++;
  }
  data.__root__.children = rootChildren;

  while (queue.length && counter < targetNodes) {
    const node = queue.shift()!;
    const remaining = targetNodes - counter;
    const canNest = node.depth < maxDepth;

    // Lumpy on purpose: most folders are small, a few are enormous.
    const roll = rand();
    const width =
      roll > 0.97
        ? 60 + Math.floor(rand() * 240)
        : roll > 0.75
          ? 12 + Math.floor(rand() * 20)
          : 3 + Math.floor(rand() * 8);
    const count = Math.max(1, Math.min(width, remaining));
    const children: string[] = [];

    for (let i = 0; i < count && counter < targetNodes; i++) {
      const id = `n${counter++}`;
      const makeFolder = canNest && rand() < 0.28 && queue.length < targetNodes / 4;

      if (makeFolder) {
        const label = `${DIRS[Math.floor(rand() * DIRS.length)]}-${id.slice(1)}`;
        data[id] = { id, label, children: [], data: { kind: "dir" } };
        queue.push({ id, depth: node.depth + 1 });
        folderCount++;
      } else {
        const ext = EXTS[Math.floor(rand() * EXTS.length)];
        const label = `${FILES[Math.floor(rand() * FILES.length)]}-${id.slice(1)}${ext}`;
        data[id] = {
          id,
          label,
          data: { kind: "file", size: Math.floor(rand() * 90_000) + 200 },
        };
        leafCount++;
      }
      children.push(id);
    }
    data[node.id].children = children;
  }

  // The shape loop stops once every folder it created sits at maxDepth, which
  // for large targets drains the queue long before the target is reached — a
  // request for 1,000,000 used to quietly return 200,946, while the button that
  // asked for it still said "1M". Top up by distributing the shortfall as leaves
  // across the folders that already exist.
  //
  // This runs only when the shape loop fell short, so targets it already hits
  // exactly (10k, 100k) produce byte-identical trees to before.
  if (counter < targetNodes) {
    const folders = Object.keys(data).filter(
      (id) => id !== "__root__" && Array.isArray(data[id].children)
    );
    let i = 0;
    while (counter < targetNodes && folders.length > 0) {
      const parent = data[folders[i % folders.length]];
      const id = `n${counter++}`;
      const ext = EXTS[Math.floor(rand() * EXTS.length)];
      data[id] = {
        id,
        label: `${FILES[Math.floor(rand() * FILES.length)]}-${id.slice(1)}${ext}`,
        data: { kind: "file", size: Math.floor(rand() * 90_000) + 200 },
      };
      parent.children!.push(id);
      leafCount++;
      i++;
    }
  }

  // Any folder still queued never got children; demote it to a file so the tree
  // has no empty folders masquerading as checkable leaves.
  for (const { id } of queue) {
    const item = data[id];
    if (item && (!item.children || item.children.length === 0)) {
      item.label = `${item.label}.ts`;
      item.data = { kind: "file", size: 1024 };
      delete item.children;
      folderCount--;
      leafCount++;
    }
  }

  return { data, folderCount, leafCount, nodeCount: counter };
}

/** The canonical small tree used across the README, the docs, and the tests. */
export const fileTree: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs: { id: "docs", label: "docs", children: ["readme", "guide"] },
  readme: { id: "readme", label: "README.md" },
  guide: { id: "guide", label: "guide.md" },
  src: { id: "src", label: "src", children: ["engine", "ui"] },
  engine: { id: "engine", label: "engine.ts" },
  ui: { id: "ui", label: "ui", children: ["tree", "row"] },
  tree: { id: "tree", label: "tree.tsx" },
  row: { id: "row", label: "row.tsx" },
};

/** A permissions hierarchy — the use case where the indeterminate state *is* the product. */
export const permissionsTree: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["billing", "users", "content"] },
  billing: { id: "billing", label: "Billing", children: ["b-read", "b-write", "b-refund"] },
  "b-read": { id: "b-read", label: "View invoices", data: { risk: "low" } },
  "b-write": { id: "b-write", label: "Edit invoices", data: { risk: "medium" } },
  "b-refund": { id: "b-refund", label: "Issue refunds", data: { risk: "high" } },
  users: { id: "users", label: "Users", children: ["u-read", "u-invite", "u-delete"] },
  "u-read": { id: "u-read", label: "View users", data: { risk: "low" } },
  "u-invite": { id: "u-invite", label: "Invite users", data: { risk: "medium" } },
  "u-delete": { id: "u-delete", label: "Delete users", data: { risk: "high" } },
  content: { id: "content", label: "Content", children: ["c-read", "c-publish"] },
  "c-read": { id: "c-read", label: "View drafts", data: { risk: "low" } },
  "c-publish": { id: "c-publish", label: "Publish", data: { risk: "medium" } },
};
