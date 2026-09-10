"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Tree, type TreeRef } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { generateTree } from "@/lib/tree-data";

const SIZES = [10_000, 100_000, 1_000_000] as const;

/**
 * The hero.
 *
 * TanStack Virtual's own landing page already proves "100k rows, N in the DOM",
 * and this library depends on TanStack Virtual — so proving virtualization here
 * would be proving someone else's point. What this demo shows instead is the
 * part that is actually ours: cascading a selection across every descendant and
 * deriving each ancestor's tri-state while the DOM stays nearly empty.
 *
 * Two honesty rules it follows:
 *  - the mounted-row count is read out of the real document, not off the
 *    virtualizer, so anyone can check it in devtools;
 *  - the timer covers the engine call *and* React's commit, because that is what
 *    the user actually waits for. The isolated engine figure lives in the
 *    benchmark table, where its methodology is stated.
 */
export function HeroDemo() {
  const [size, setSize] = useState<(typeof SIZES)[number]>(10_000);
  const [query, setQuery] = useState("");
  const [checkedCount, setCheckedCount] = useState(0);
  const [lastOpMs, setLastOpMs] = useState<null | number>(null);
  const [lastOpLabel, setLastOpLabel] = useState("last op");
  const [mountedRows, setMountedRows] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [isPending, startTransition] = useTransition();
  // The size being built, so the overlay can name it. During a transition `size`
  // still holds the old value.
  const [pendingSize, setPendingSize] = useState<null | number>(null);

  const treeRef = useRef<TreeRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const deferredQuery = useDeferredValue(query);

  // Stamped when the size button is clicked and read once the new tree has
  // committed, so this covers what the user is actually waiting through:
  // generating the data, the Engine indexing it, and React's commit.
  //
  // It used to time generateTree() alone and label the result "built tree",
  // which under-reported by ~4x at a million nodes — generation is the smaller
  // half of that wait. A metric that flatters the thing it measures is worse
  // than no metric.
  const buildStartedAt = useRef<null | number>(null);
  const { data, folderCount, leafCount, nodeCount } = useMemo(
    () => generateTree(size),
    [size]
  );

  // Open a few branches on load so the tree reads as a tree rather than a list
  // of twelve closed folders.
  useEffect(() => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    const top = engine.getVisibleItems().slice(0, 3);
    for (const row of top) if (row.isFolder) engine.setExpandedFor(row.id, true);
  }, [data]);

  const measure = useCallback(() => {
    const dom = containerRef.current?.querySelectorAll("[data-rvct-row]").length ?? 0;
    setMountedRows(dom);
    setVisibleRows(treeRef.current?.getEngine().getVisibleItems().length ?? 0);
  }, []);

  useEffect(() => {
    measure();
    const id = window.setInterval(measure, 500);
    return () => window.clearInterval(id);
  }, [measure]);

  const run = useCallback(
    (label: string, fn: () => void) => {
      const start = performance.now();
      fn();
      // The engine notifies synchronously inside a discrete event, so React has
      // already committed by the time this line runs.
      setLastOpMs(performance.now() - start);
      setLastOpLabel(label);
      requestAnimationFrame(measure);
    },
    [measure]
  );

  const withEngine = (label: string, fn: (engine: NonNullable<ReturnType<TreeRef["getEngine"]>>) => void) => () => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    run(label, () => fn(engine));
  };

  // A transition rather than requestAnimationFrame: rAF is paused in a
  // background tab, which would leave the overlay stuck on "building…" for
  // anyone who switches away mid-click. React paints the pending state either
  // way.
  const changeSize = (next: (typeof SIZES)[number]) => {
    if (next === size) return;
    setLastOpMs(null);
    setPendingSize(next);
    buildStartedAt.current = performance.now();
    startTransition(() => setSize(next));
  };

  useEffect(() => {
    measure();
    setPendingSize(null);
    if (buildStartedAt.current === null) return;
    const startedAt = buildStartedAt.current;
    buildStartedAt.current = null;
    // Read the clock here rather than inside requestAnimationFrame: rAF is
    // paused in a background tab, so a reader who switched away mid-build would
    // come back to a metric that never filled in. This lands after React has
    // committed the new rows — the Tree's own effects run before this one — and
    // only misses the paint of the ~22 rows on screen.
    setLastOpMs(performance.now() - startedAt);
    setLastOpLabel("ready in");
  }, [data, measure]);

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
      data-hero-demo=""
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <div className="relative min-w-[170px] flex-1">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-faint)]"
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="14"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            aria-label="Filter the tree"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-8 pr-3 font-mono text-[13px] outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${nodeCount.toLocaleString()} nodes…`}
            value={query}
          />
        </div>

        <div className="flex overflow-hidden rounded-md border border-[var(--color-border)]">
          {SIZES.map((n) => (
            <button
              className={`px-2.5 py-1.5 font-mono text-[12px] transition-colors ${
                size === n
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              }`}
              key={n}
              onClick={() => changeSize(n)}
              type="button"
            >
              {n >= 1_000_000 ? "1M" : `${n / 1000}k`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <ToolbarButton onClick={withEngine("select all", (e) => e.checkAll())}>
            Select all
          </ToolbarButton>
          <ToolbarButton onClick={withEngine("clear", (e) => e.uncheckAll())}>Clear</ToolbarButton>
          <ToolbarButton onClick={withEngine("expand all", (e) => e.expandAll())}>
            Expand all
          </ToolbarButton>
          <ToolbarButton onClick={withEngine("collapse", (e) => e.collapseAll())}>
            Collapse
          </ToolbarButton>
        </div>
      </div>

      <TreeSkin>
        <div className="relative" ref={containerRef}>
          {isPending && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--color-surface)]/80 font-mono text-[12px] text-[var(--color-muted)]">
              building {(pendingSize ?? size).toLocaleString()} nodes…
            </div>
          )}
          <Tree
            aria-label="Generated source tree"
            data={data}
            height={420}
            onCheck={(ids) => setCheckedCount(ids.length)}
            ref={treeRef}
            renderItem={({ isFolder, item }) => (
              <span className="flex items-center gap-1.5">
                <FileGlyph isFolder={isFolder} />
                {item.label}
              </span>
            )}
            searchQuery={deferredQuery}
          />
        </div>
      </TreeSkin>

      <MetricBar>
        <Metric label="nodes" value={nodeCount.toLocaleString()} />
        <Metric label="folders" value={folderCount.toLocaleString()} />
        <Metric label="leaves" value={leafCount.toLocaleString()} />
        <Metric label="rows expanded" value={visibleRows.toLocaleString()} />
        <Metric
          accent
          label="rows in the DOM"
          title="Counted with querySelectorAll('[data-rvct-row]') on the live document — open devtools and check it."
          value={mountedRows.toLocaleString()}
        />
        <Metric label="checked" value={checkedCount.toLocaleString()} />
        <Metric
          accent={lastOpMs !== null}
          label={lastOpLabel}
          title="Wall-clock for the engine call plus React's commit — what you actually wait for."
          value={lastOpMs === null ? "—" : formatMs(lastOpMs)}
        />
      </MetricBar>
    </div>
  );
}

function formatMs(ms: number) {
  if (ms < 1) return `${Math.round(ms * 1000)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function ToolbarButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
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

function FileGlyph({ isFolder }: { isFolder: boolean }) {
  return isFolder ? (
    <svg aria-hidden="true" className="shrink-0 text-[var(--color-accent)]" fill="none" height="13" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="shrink-0 text-[var(--color-faint)]" fill="none" height="13" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
