"use client";

import { useMemo, useRef, useState } from "react";
import { Tree, type TreeDefinition, type TreeRef } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { fileTree } from "@/lib/tree-data";

/** Byte counts hung off the canonical fileTree, keyed by node ID. */
const BYTES: Record<string, number> = {
  engine: 31_907,
  guide: 18_204,
  readme: 4_812,
  row: 6_755,
  tree: 22_140,
};

/**
 * The canonical `fileTree`, plus a size on every leaf and one deliberately
 * empty `assets/` directory — the thing this recipe exists to warn about.
 */
const files: TreeDefinition = (() => {
  const withSizes: TreeDefinition = {};
  for (const [id, item] of Object.entries(fileTree)) {
    withSizes[id] =
      BYTES[id] === undefined ? item : { ...item, data: { kind: "file", size: BYTES[id] } };
  }
  return {
    ...withSizes,
    assets: { children: [], data: { kind: "dir" }, id: "assets", label: "assets" },
    src: { ...withSizes.src, children: ["engine", "ui", "assets"] },
  };
})();

const INITIAL_EXPANDED = ["docs", "src", "ui"];

export function FilePickerDemo() {
  const [checked, setChecked] = useState<string[]>([]);
  const treeRef = useRef<TreeRef>(null);

  const totalBytes = useMemo(
    () => checked.reduce((sum, id) => sum + ((files[id]?.data?.size as number) ?? 0), 0),
    [checked]
  );
  const allBytes = useMemo(
    () => Object.values(BYTES).reduce((sum, n) => sum + n, 0),
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <span className="mr-auto font-mono text-[12px] text-[var(--color-faint)]">
          Attach files
        </span>
        <Button onClick={() => treeRef.current?.getEngine().checkAll()}>Select all</Button>
        <Button onClick={() => treeRef.current?.getEngine().uncheckAll()}>Clear</Button>
        <Button onClick={() => treeRef.current?.expandAll()}>Expand all</Button>
      </div>

      <TreeSkin>
        <Tree
          aria-label="Project files"
          data={files}
          estimateSize={30}
          expandedItems={INITIAL_EXPANDED}
          height={300}
          onCheck={setChecked}
          ref={treeRef}
          renderItem={({ isFolder, item }) => {
            // `assets/` declares `children: []`, so the engine calls it a leaf.
            // The label still looks like a directory, which is exactly the trap.
            const looksLikeDir = !item.label.includes(".");
            const size = item.data?.size as number | undefined;
            return (
              <span className="flex items-center gap-1.5">
                <Glyph isFolder={isFolder || looksLikeDir} label={item.label} />
                <span>{item.label}</span>
                {size !== undefined && (
                  <span className="tnum ml-1 font-mono text-[11px] text-[var(--color-faint)]">
                    {formatBytes(size)}
                  </span>
                )}
                {!isFolder && looksLikeDir && (
                  <span className="ml-1 rounded border border-[var(--color-warn)] px-1 py-px font-mono text-[10px] uppercase tracking-wide text-[var(--color-warn)]">
                    empty — checkable
                  </span>
                )}
              </span>
            );
          }}
        />
      </TreeSkin>

      <MetricBar>
        <Metric
          label="checkable"
          title="Five files plus the empty assets/ directory, which the engine counts as a leaf — which is the whole point of this recipe."
          value={`${checked.length} of 6`}
        />
        <Metric accent={checked.length > 0} label="attached" value={formatBytes(totalBytes)} />
        <Metric label="of" value={formatBytes(allBytes)} />
      </MetricBar>

      <div className="border-t border-[var(--color-border)] px-4 py-2.5">
        <p className="font-mono text-[11.5px] leading-relaxed text-[var(--color-faint)]">
          onCheck →{" "}
          <span className="text-[var(--color-muted)]">
            {checked.length === 0 ? "[]" : JSON.stringify(checked.slice().sort())}
          </span>
        </p>
      </div>
    </>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} kB`;
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

const EXT_COLOR: Record<string, string> = {
  md: "var(--color-muted)",
  ts: "var(--color-accent)",
  tsx: "var(--color-ok)",
};

function Glyph({ isFolder, label }: { isFolder: boolean; label: string }) {
  if (isFolder) {
    return (
      <svg
        aria-hidden="true"
        className="shrink-0 text-[var(--color-accent)]"
        fill="none"
        height="13"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        width="13"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    );
  }
  const ext = label.split(".").pop() ?? "";
  return (
    <span
      className="inline-grid h-[13px] w-[22px] shrink-0 place-items-center rounded-[3px] border font-mono text-[8.5px] uppercase leading-none"
      style={{ borderColor: EXT_COLOR[ext] ?? "var(--color-border-strong)", color: EXT_COLOR[ext] ?? "var(--color-faint)" }}
    >
      {ext.slice(0, 3)}
    </span>
  );
}
