"use client";

import { useMemo, useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";

/**
 * Three "API pages" of the canonical fileTree. Page 1 arrives with the request;
 * pages 2 and 3 land later, and everything the user did in the meantime has to
 * survive them.
 */
type Page = { nodes: TreeDefinition; rootChildren: string[] };

const PAGES: Page[] = [
  {
    nodes: {
      docs: { children: ["readme", "guide"], id: "docs", label: "docs" },
      guide: { id: "guide", label: "guide.md" },
      readme: { id: "readme", label: "README.md" },
    },
    rootChildren: ["docs"],
  },
  {
    nodes: {
      engine: { id: "engine", label: "engine.ts" },
      row: { id: "row", label: "row.tsx" },
      src: { children: ["engine", "ui"], id: "src", label: "src" },
      tree: { id: "tree", label: "tree.tsx" },
      ui: { children: ["tree", "row"], id: "ui", label: "ui" },
    },
    rootChildren: ["src"],
  },
  {
    nodes: {
      "e2e-spec": { id: "e2e-spec", label: "keyboard.e2e.ts" },
      tests: { children: ["unit-spec", "e2e-spec"], id: "tests", label: "tests" },
      "unit-spec": { id: "unit-spec", label: "engine.test.ts" },
    },
    rootChildren: ["tests"],
  },
];

const LATENCY_MS = 700;

export function AsyncPagesDemo() {
  const [loaded, setLoaded] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);

  // A new object every time `loaded` changes. `<Tree>` hands it to
  // engine.setData(), which swaps the structure in place — selection, expansion
  // and any active query survive for every node that still exists.
  const data = useMemo<TreeDefinition>(() => {
    const pages = PAGES.slice(0, loaded);
    const nodes: TreeDefinition = {};
    const rootChildren: string[] = [];
    for (const page of pages) {
      Object.assign(nodes, page.nodes);
      rootChildren.push(...page.rootChildren);
    }
    return {
      __root__: { children: rootChildren, id: "__root__", label: "root" },
      ...nodes,
    };
  }, [loaded]);

  const nodeCount = Object.keys(data).length - 1;
  const done = loaded >= PAGES.length;

  const loadNext = () => {
    if (done || loading) return;
    setLoading(true);
    // Stand-in for a fetch. Batch a whole page in: every setData rebuilds the
    // index, so appending one node at a time is the expensive way to do this.
    window.setTimeout(() => {
      setLoaded((n) => n + 1);
      setLoading(false);
    }, LATENCY_MS);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <span className="mr-auto font-mono text-[12px] text-[var(--color-faint)]">
          GET /api/tree?page={loaded}
        </span>
        <button
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] disabled:opacity-40 disabled:hover:bg-transparent"
          disabled={done || loading}
          onClick={loadNext}
          type="button"
        >
          {loading ? "Loading…" : done ? "All pages loaded" : `Load page ${loaded + 1}`}
        </button>
        <button
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
          onClick={() => setLoaded(1)}
          type="button"
        >
          Reset
        </button>
      </div>

      <TreeSkin>
        <Tree
          aria-label="Repository, loaded in pages"
          data={data}
          estimateSize={30}
          height={280}
          onCheck={setChecked}
          onExpand={(ids) => setExpanded(ids.filter((id) => id !== "__root__"))}
        />
      </TreeSkin>

      <MetricBar>
        <Metric label="pages" value={`${loaded} of ${PAGES.length}`} />
        <Metric label="nodes" value={String(nodeCount)} />
        <Metric accent={checked.length > 0} label="still checked" value={String(checked.length)} />
        <Metric label="still open" value={String(expanded.length)} />
      </MetricBar>

      <div className="border-t border-[var(--color-border)] px-4 py-2.5">
        <p className="font-mono text-[11.5px] leading-relaxed text-[var(--color-faint)]">
          checked →{" "}
          <span className="text-[var(--color-muted)]">
            {checked.length === 0 ? "[]" : JSON.stringify(checked.slice().sort())}
          </span>
        </p>
        <p className="mt-1 text-[12px] text-[var(--color-faint)]">
          Check a file, open a folder, then load the next page. Nothing resets.
        </p>
      </div>
    </>
  );
}
