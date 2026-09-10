"use client";

import { useEffect, useRef, useState } from "react";
import { Tree, type TreeRef } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { fileTree } from "@/lib/tree-data";

/**
 * Every method on `TreeRef`, wired to a real toolbar, plus a status bar fed by
 * `getEngine()`. The status bar is the interesting half: nothing on `<Tree>`
 * reports the match count or the sparse assignment list, so it subscribes to
 * the engine directly.
 */

type Stats = {
  assignments: number;
  checked: number;
  matches: number;
  rows: number;
  searching: boolean;
};

const EMPTY: Stats = { assignments: 0, checked: 0, matches: 0, rows: 0, searching: false };

export function DemoCustomToolbar() {
  const treeRef = useRef<TreeRef>(null);
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<Stats>(EMPTY);

  // The ref is null during the first render, so the subscription is set up in an
  // effect. `subscribe` returns its own unsubscribe function.
  useEffect(() => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    const read = () =>
      setStats({
        assignments: engine.getCheckedSubtrees().length,
        checked: engine.getAllChecked().length,
        matches: engine.getMatchCount(),
        rows: engine.getVisibleItems().length,
        searching: engine.isSearchActive(),
      });
    read();
    return engine.subscribe(read);
  }, []);

  const button =
    "rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-[12px] text-[var(--color-fg)] transition-colors duration-150 hover:border-[var(--color-border-strong)]";

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <button className={button} onClick={() => treeRef.current?.expandAll()} type="button">
          expandAll()
        </button>
        <button className={button} onClick={() => treeRef.current?.collapseAll()} type="button">
          collapseAll()
        </button>
        <button className={button} onClick={() => treeRef.current?.scrollToId("row")} type="button">
          scrollToId(&quot;row&quot;)
        </button>
        <button className={button} onClick={() => treeRef.current?.focusId("row")} type="button">
          focusId(&quot;row&quot;)
        </button>
        <input
          className="ml-auto w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 font-mono text-[12px] text-[var(--color-fg)] placeholder:text-[var(--color-faint)]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search…"
          value={query}
        />
      </div>

      <div className="rvct px-2 py-1.5 font-mono">
        <Tree
          aria-label="Imperative API demo"
          data={fileTree}
          height={200}
          ref={treeRef}
          searchQuery={query}
        />
      </div>

      <MetricBar>
        <Metric
          label="visible rows"
          title="engine.getVisibleItems().length — every row in the flattened view, not only the ones the virtualizer has mounted"
          value={String(stats.rows)}
        />
        <Metric label="checked leaves" accent={stats.checked > 0} value={String(stats.checked)} />
        <Metric
          label="assignments"
          title="engine.getCheckedSubtrees().length — the sparse selection behind those leaves"
          value={String(stats.assignments)}
        />
        <Metric
          label="matches"
          title="engine.getMatchCount() — 0 while search is inactive"
          value={stats.searching ? String(stats.matches) : "—"}
        />
      </MetricBar>
    </div>
  );
}
