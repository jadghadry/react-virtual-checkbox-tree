"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Engine, Tree } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { generateTree } from "@/lib/tree-data";

// Deliberately far below the hero's node count. The point of this demo is to
// stall convincingly, not to lock up someone's phone.
const NODES = 12_000;

export function NaiveRace() {
  const [virtualized, setVirtualized] = useState(true);
  const [renderMs, setRenderMs] = useState<null | number>(null);
  const [mounted, setMounted] = useState(0);
  const [fps, setFps] = useState(60);

  const containerRef = useRef<HTMLDivElement>(null);
  const { data, nodeCount } = useMemo(() => generateTree(NODES, 11), []);

  // Every row, flattened once with the Engine — so the naive side renders the
  // exact same list, and the only variable is whether it is virtualized.
  const allRows = useMemo(() => {
    const engine = new Engine(data);
    engine.expandAll();
    return engine.getVisibleItems();
  }, [data]);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const start = performance.now();
    const id = requestAnimationFrame(() => {
      setRenderMs(performance.now() - start);
      setMounted(containerRef.current?.querySelectorAll("[data-row]").length ?? 0);
    });
    return () => cancelAnimationFrame(id);
  }, [virtualized]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
        <span className="text-[13px] text-[var(--color-muted)]">Virtualized</span>
        <div className="flex overflow-hidden rounded-md border border-[var(--color-border)]">
          {([true, false] as const).map((value) => (
            <button
              className={`px-3 py-1.5 font-mono text-[12px] transition-colors ${
                virtualized === value
                  ? value
                    ? "bg-[var(--color-ok)] text-[var(--color-bg)]"
                    : "bg-[var(--color-warn)] text-[var(--color-bg)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
              }`}
              key={String(value)}
              onClick={() => setVirtualized(value)}
              type="button"
            >
              {value ? "on" : "off"}
            </button>
          ))}
        </div>
        {!virtualized && (
          <span className="font-mono text-[12px] text-[var(--color-warn)]">
            ⚠ rendering all {nodeCount.toLocaleString()} rows — this will stutter, on purpose
          </span>
        )}
      </div>

      <div ref={containerRef}>
        {virtualized ? (
          <TreeSkin>
            <Tree
              aria-label="Virtualized tree"
              data={data}
              expandedItems={allRows.filter((r) => r.isFolder).map((r) => r.id)}
              height={320}
              renderItem={({ item }) => <span data-row="">{item.label}</span>}
            />
          </TreeSkin>
        ) : (
          <div className="rvct h-[320px] overflow-auto px-2 py-1.5 font-mono">
            {allRows.map((row) => (
              <div
                className="flex h-8 items-center gap-1.5 rounded text-[13px] hover:bg-[var(--color-surface-2)]"
                data-row=""
                key={row.id}
                style={{ paddingInlineStart: `${row.level * 20 + 20}px` }}
              >
                <input readOnly tabIndex={-1} type="checkbox" />
                <span className={row.isFolder ? "" : "text-[var(--color-muted)]"}>
                  {labelOf(data, row.id)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MetricBar>
        <Metric label="nodes" value={nodeCount.toLocaleString()} />
        <Metric
          accent={virtualized}
          label="rows in the DOM"
          value={mounted.toLocaleString()}
        />
        <Metric
          accent={renderMs !== null && renderMs < 50}
          label="time to first paint"
          value={renderMs === null ? "—" : `${renderMs.toFixed(0)} ms`}
        />
        <Metric accent={fps > 45} label="fps" value={String(fps)} />
      </MetricBar>

      <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-faint)]">
        Scroll both versions. The virtualized one keeps a constant DOM no matter how far you go; the
        naive one has already paid for every row before you saw the first one. Note that this is only
        12,000 nodes — the demo at the top of the page has eight times as many and does not change
        these numbers at all.
      </p>
    </div>
  );
}

function labelOf(data: Record<string, { label: string }>, id: string) {
  return data[id]?.label ?? id;
}
