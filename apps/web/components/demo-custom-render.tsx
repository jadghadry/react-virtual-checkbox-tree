"use client";

import { useState } from "react";
import {
  CheckedState,
  Tree,
  type TreeCheckboxRenderProps,
  type TreeExpanderRenderProps,
  type TreeItemRenderProps,
} from "react-virtual-checkbox-tree";

import { fileTree } from "@/lib/tree-data";

/**
 * The three render props, all replaced at once, over the canonical `fileTree`.
 *
 * Kept deliberately close to the code printed on /docs/rendering: the point of
 * the demo is that the reader can see the exact snippet running, including the
 * two details that bite — `a11yProps` on the controls, and `stopPropagation`
 * inside the custom expander.
 */

/** Stable identity: a fresh array on every render would re-apply expansion each time. */
const INITIALLY_EXPANDED = ["docs", "src", "ui"];

const META: Record<string, string> = {
  docs: "2 items",
  guide: "12.4 kB · Markdown",
  engine: "31.2 kB · TypeScript",
  readme: "4.1 kB · Markdown",
  row: "3.8 kB · TSX",
  src: "2 items",
  tree: "18.7 kB · TSX",
  ui: "2 items",
};

function Expander({ a11yProps, isExpanded, onToggle }: TreeExpanderRenderProps) {
  return (
    <button
      {...a11yProps}
      className="inline-flex size-4 items-center justify-center rounded text-[var(--color-faint)] transition-transform duration-150 hover:text-[var(--color-fg)]"
      onClick={(event) => {
        // Without this the click also reaches the row, which toggles the same
        // folder a second time — the net effect is nothing happening at all.
        event.stopPropagation();
        onToggle();
      }}
      style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
      type="button"
    >
      <svg aria-hidden fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}

function Checkbox({ a11yProps, checkedState }: TreeCheckboxRenderProps) {
  const checked = checkedState === CheckedState.Checked;
  const mixed = checkedState === CheckedState.Indeterminate;
  return (
    <span
      {...a11yProps}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150"
      style={{
        background: checked || mixed ? "var(--color-accent)" : "transparent",
        borderColor: checked || mixed ? "var(--color-accent)" : "var(--color-border-strong)",
        color: "var(--color-accent-fg)",
      }}
    >
      {checked ? (
        <svg aria-hidden fill="none" height="10" viewBox="0 0 10 10" width="10">
          <path d="M1.5 5.2l2.2 2.2L8.5 2.6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : mixed ? (
        <svg aria-hidden fill="none" height="10" viewBox="0 0 10 10" width="10">
          <path d="M2 5h6" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : null}
    </span>
  );
}

function Row({ checkedState, id, isFolder, item }: TreeItemRenderProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <svg
        aria-hidden
        className="shrink-0"
        fill="none"
        height="14"
        style={{ color: isFolder ? "var(--color-accent)" : "var(--color-faint)" }}
        viewBox="0 0 16 16"
        width="14"
      >
        {isFolder ? (
          <path
            d="M1.5 4.2c0-.6.4-1 1-1h3l1.3 1.5h6.7c.6 0 1 .4 1 1v6.6c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1V4.2z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ) : (
          <path
            d="M3.5 1.8h5l4 4v8.4c0 .3-.2.5-.5.5h-8.5c-.3 0-.5-.2-.5-.5V2.3c0-.3.2-.5.5-.5z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        )}
      </svg>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className="truncate text-[13px]"
          style={{
            color:
              checkedState === CheckedState.Unchecked
                ? "var(--color-muted)"
                : "var(--color-fg)",
          }}
        >
          {item.label}
        </span>
        <span className="tnum truncate font-mono text-[10.5px] text-[var(--color-faint)]">
          {META[id] ?? "—"}
        </span>
      </span>
    </span>
  );
}

export function DemoCustomRender() {
  const [checked, setChecked] = useState<string[]>(["engine"]);

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="rvct px-2 py-1.5">
        <Tree
          aria-label="Custom rendered file tree"
          checkedItems={checked}
          data={fileTree}
          estimateSize={44}
          expandedItems={INITIALLY_EXPANDED}
          height={280}
          indent={22}
          onCheck={setChecked}
          renderCheckbox={Checkbox}
          renderExpander={Expander}
          renderItem={Row}
        />
      </div>
      <div className="flex items-baseline gap-2 border-t border-[var(--color-border)] px-4 py-2">
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
          checked leaves
        </span>
        <span className="tnum font-mono text-[12px] text-[var(--color-fg)]">
          {checked.length === 0 ? "none" : checked.join(", ")}
        </span>
      </div>
    </div>
  );
}
