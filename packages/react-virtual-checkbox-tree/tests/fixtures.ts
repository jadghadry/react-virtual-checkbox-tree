import type { TreeDefinition } from "../src/types";

/**
 * The canonical example used across the README, the docs site, and these tests.
 *
 * __root__
 *  ├─ docs/       (folder)
 *  │   ├─ readme.md
 *  │   └─ guide.md
 *  └─ src/        (folder)
 *      ├─ engine.ts
 *      └─ ui/     (folder)
 *          ├─ tree.tsx
 *          └─ row.tsx
 */
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

/** Builds a wide, deep synthetic tree for scale tests and benchmarks. */
export function makeTree(opts: {
  branching: number;
  depth: number;
  labelPrefix?: string;
}): { data: TreeDefinition; leafIds: string[]; nodeCount: number } {
  const { branching, depth, labelPrefix = "node" } = opts;
  const data: TreeDefinition = {
    __root__: { id: "__root__", label: "root", children: [] },
  };
  const leafIds: string[] = [];
  let counter = 0;

  const build = (parentId: string, level: number) => {
    const children: string[] = [];
    for (let i = 0; i < branching; i++) {
      const id = `n${counter++}`;
      children.push(id);
      if (level + 1 >= depth) {
        data[id] = { id, label: `${labelPrefix}-${id}` };
        leafIds.push(id);
      } else {
        data[id] = { id, label: `${labelPrefix}-${id}`, children: [] };
        build(id, level + 1);
      }
    }
    data[parentId].children = children;
  };

  build("__root__", 0);
  return { data, leafIds, nodeCount: counter };
}

/** A deliberately deep, narrow chain — the shape that blows recursive stacks. */
export function makeDeepChain(depth: number): TreeDefinition {
  const data: TreeDefinition = {
    __root__: { id: "__root__", label: "root", children: ["d0"] },
  };
  for (let i = 0; i < depth; i++) {
    const id = `d${i}`;
    const next = `d${i + 1}`;
    data[id] =
      i === depth - 1
        ? { id, label: `leaf-${i}` }
        : { id, label: `level-${i}`, children: [next] };
  }
  return data;
}
