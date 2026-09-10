"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tree, type TreeRef } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { generateTree } from "@/lib/tree-data";

const DEMO_QUERY = "resolver";

/**
 * Types a query one character at a time when it scrolls into view, so the
 * filtering behaviour is visible without the reader having to do anything.
 * Respects prefers-reduced-motion, and any real keystroke cancels the playback.
 */
export function SearchTeleport() {
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [autoplayed, setAutoplayed] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<TreeRef>(null);
  const cancelled = useRef(false);

  const { data, nodeCount } = useMemo(() => generateTree(50_000, 7), []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || autoplayed) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAutoplayed(true);
      setQuery(DEMO_QUERY);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || autoplayed) return;
        setAutoplayed(true);
        observer.disconnect();

        let i = 0;
        const tick = () => {
          if (cancelled.current) return;
          i += 1;
          setQuery(DEMO_QUERY.slice(0, i));
          if (i < DEMO_QUERY.length) window.setTimeout(tick, 110);
        };
        window.setTimeout(tick, 350);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [autoplayed]);

  const engine = treeRef.current?.getEngine();
  const matches = engine?.getMatchCount() ?? 0;
  const visible = engine?.getVisibleItems().length ?? 0;

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      ref={wrapRef}
    >
      <div className="border-b border-[var(--color-border)] p-3">
        <input
          aria-label="Filter the tree"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 font-mono text-[13px] outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
          onChange={(e) => {
            cancelled.current = true;
            setQuery(e.target.value);
          }}
          placeholder="Try 'resolver', or a folder name like 'hooks'…"
          value={query}
        />
      </div>

      <TreeSkin>
        <Tree
          aria-label="Filtered source tree"
          data={data}
          height={340}
          onCheck={setChecked}
          ref={treeRef}
          searchQuery={query}
        />
      </TreeSkin>

      <MetricBar>
        <Metric label="nodes" value={nodeCount.toLocaleString()} />
        <Metric accent={matches > 0} label="matches" value={matches.toLocaleString()} />
        <Metric label="rows after filtering" value={visible.toLocaleString()} />
        <Metric label="checked" value={checked.length.toLocaleString()} />
      </MetricBar>

      <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-[12.5px] leading-relaxed text-[var(--color-faint)]">
        Check a folder while the filter is on, then clear the box. Only the leaves that were on
        screen ended up checked — and the folders you had open are open again.
      </p>
    </div>
  );
}
