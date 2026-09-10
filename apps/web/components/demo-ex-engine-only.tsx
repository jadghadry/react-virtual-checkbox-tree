"use client";

import type { KeyboardEvent } from "react";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { CheckedState, Engine } from "react-virtual-checkbox-tree/engine";

import { Metric, MetricBar } from "@/components/metrics";
import { fileTree } from "@/lib/tree-data";

/**
 * The same tree, rendered without `<Tree>`.
 *
 * `react-virtual-checkbox-tree/engine` has no React import and no virtualizer:
 * it is a plain observable class. Everything below — the rows, the ARIA, the
 * keyboard map — is code you would own if you took this route.
 */
export function EngineOnlyDemo() {
  const [engine] = useState(
    () => new Engine(fileTree, { initialExpanded: ["docs", "src", "ui"] })
  );
  const [activeId, setActiveId] = useState<null | string>(null);
  const reactId = useId();
  const domId = (id: string) => `${reactId}-${id}`;

  const subscribe = useCallback((cb: () => void) => engine.subscribe(cb), [engine]);
  // Two counters, one string: structure moves rows, selection only repaints them.
  const snapshot = useCallback(
    () => `${engine.getStructureVersion()}:${engine.getSelectionVersion()}`,
    [engine]
  );
  useSyncExternalStore(subscribe, snapshot, snapshot);

  const rows = engine.getVisibleItems();

  const move = (index: number) => {
    if (index < 0 || index >= rows.length) return;
    setActiveId(rows[index].id);
  };

  // You own this. `<Tree>` ships it; the engine does not.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = activeId ? engine.indexOf(activeId) : -1;
    const row = index >= 0 ? rows[index] : null;

    switch (event.key) {
      case " ":
        if (!row) return;
        event.preventDefault();
        engine.toggle(row.id, engine.getViewState(row.id) !== CheckedState.Checked);
        return;
      case "ArrowDown":
        event.preventDefault();
        move(index < 0 ? 0 : index + 1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        if (!row) return;
        if (row.isFolder && row.isExpanded) engine.setExpandedFor(row.id, false);
        else {
          const parent = engine.getParent(row.id);
          if (parent) move(engine.indexOf(parent));
        }
        return;
      case "ArrowRight":
        event.preventDefault();
        if (!row || !row.isFolder) return;
        if (!row.isExpanded) engine.setExpandedFor(row.id, true);
        else move(index + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        move(index < 0 ? rows.length - 1 : index - 1);
        return;
      case "End":
        event.preventDefault();
        move(rows.length - 1);
        return;
      case "Home":
        event.preventDefault();
        move(0);
        return;
      default:
        return;
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <span className="mr-auto font-mono text-[12px] text-[var(--color-faint)]">
          import &#123; Engine &#125; from &quot;react-virtual-checkbox-tree/engine&quot;
        </span>
        <ToolButton onClick={() => engine.expandAll()}>expandAll()</ToolButton>
        <ToolButton onClick={() => engine.collapseAll()}>collapseAll()</ToolButton>
        <ToolButton onClick={() => engine.uncheckAll()}>uncheckAll()</ToolButton>
      </div>

      <div
        aria-activedescendant={activeId ? domId(activeId) : undefined}
        aria-label="Project files, rendered by hand"
        aria-multiselectable
        className="max-h-[300px] overflow-auto px-2 py-1.5 font-mono"
        onKeyDown={onKeyDown}
        role="tree"
        tabIndex={0}
      >
        {rows.map((row) => {
          const state = engine.getViewState(row.id);
          return (
            <div
              aria-checked={
                state === CheckedState.Indeterminate ? "mixed" : state === CheckedState.Checked
              }
              aria-expanded={row.isFolder ? row.isExpanded : undefined}
              aria-level={row.level + 1}
              aria-posinset={row.posInSet}
              aria-setsize={row.setSize}
              className="flex h-[28px] cursor-pointer items-center gap-2 rounded text-[13px] transition-colors duration-150 hover:bg-[var(--color-surface-2)]"
              id={domId(row.id)}
              key={row.id}
              onClick={() => {
                setActiveId(row.id);
                if (row.isFolder) engine.toggleExpanded(row.id);
                else engine.toggle(row.id, state !== CheckedState.Checked);
              }}
              role="treeitem"
              style={{
                background:
                  activeId === row.id
                    ? "color-mix(in oklch, var(--color-accent) 18%, transparent)"
                    : undefined,
                paddingLeft: row.level * 18 + 8,
              }}
            >
              <span className="w-3 shrink-0 text-[10px] text-[var(--color-faint)]">
                {row.isFolder ? (row.isExpanded ? "−" : "+") : ""}
              </span>
              <span
                aria-hidden="true"
                className="grid size-[14px] shrink-0 place-items-center rounded-[3px] border text-[10px] leading-none"
                style={{
                  background:
                    state === CheckedState.Checked ? "var(--color-accent)" : "transparent",
                  borderColor:
                    state === CheckedState.Unchecked
                      ? "var(--color-border-strong)"
                      : "var(--color-accent)",
                  color: "var(--color-accent-fg)",
                }}
              >
                {state === CheckedState.Checked ? "✓" : ""}
                {state === CheckedState.Indeterminate ? (
                  <span className="block h-[2px] w-[7px] rounded-full bg-[var(--color-accent)]" />
                ) : null}
              </span>
              <span
                className={
                  row.isFolder ? "text-[var(--color-fg)]" : "text-[var(--color-muted)]"
                }
              >
                {engine.getLabel(row.id)}
              </span>
            </div>
          );
        })}
      </div>

      <MetricBar>
        <Metric label="nodes" value={String(engine.getNodeCount())} />
        <Metric label="rows in the DOM" value={String(rows.length)} />
        <Metric
          accent
          label="checked leaves"
          value={String(engine.getAllChecked().length)}
        />
        <Metric label="virtualized" title="Not by the engine — that is the trade." value="no" />
      </MetricBar>
    </>
  );
}

function ToolButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 font-mono text-[11.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
