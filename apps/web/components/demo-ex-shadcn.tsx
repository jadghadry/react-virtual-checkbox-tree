"use client";

import { CheckedState, Tree } from "react-virtual-checkbox-tree";

import { fileTree } from "@/lib/tree-data";

const INITIAL_EXPANDED = ["docs", "src", "ui"];

/**
 * A shadcn-shaped tree without installing shadcn.
 *
 * The checkbox below is hand-written to the same shape Radix produces — a
 * `data-state` of "checked" | "indeterminate" | "unchecked" on a square button —
 * so the CSS you would write for the real `<Checkbox>` is the CSS written here.
 */
export function ShadcnStyledDemo() {
  return (
    <div className="p-2">
      <Tree
        aria-label="Project files, shadcn styling"
        className="rounded-md"
        data={fileTree}
        estimateSize={32}
        expandedItems={INITIAL_EXPANDED}
        height={288}
        indent={16}
        renderCheckbox={({ a11yProps, checkedState }) => (
          <RadixShapedCheckbox a11yProps={a11yProps} state={checkedState} />
        )}
        renderExpander={({ a11yProps, isExpanded }) => (
          <span
            {...a11yProps}
            className="grid size-4 shrink-0 place-items-center text-[var(--color-faint)] transition-transform duration-150"
            style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
          >
            <ChevronRight />
          </span>
        )}
        renderItem={({ isFolder, item }) => (
          <span className="flex items-center gap-2 text-[13px]">
            {isFolder ? <FolderIcon /> : <FileIcon />}
            <span className="text-[var(--color-fg)]">{item.label}</span>
          </span>
        )}
      />
    </div>
  );
}

function RadixShapedCheckbox({
  a11yProps,
  state,
}: {
  a11yProps: { "aria-hidden": true; tabIndex: -1 };
  state: CheckedState;
}) {
  const checked = state === CheckedState.Checked;
  const mixed = state === CheckedState.Indeterminate;
  return (
    <span
      {...a11yProps}
      className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-[var(--color-border-strong)] transition-colors duration-150"
      data-state={state}
      style={{
        background: checked || mixed ? "var(--color-fg)" : "transparent",
        borderColor: checked || mixed ? "var(--color-fg)" : "var(--color-border-strong)",
      }}
    >
      {checked && (
        <svg
          aria-hidden="true"
          fill="none"
          height="11"
          stroke="var(--color-bg)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="11"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {mixed && (
        <svg
          aria-hidden="true"
          fill="none"
          height="11"
          stroke="var(--color-bg)"
          strokeLinecap="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="11"
        >
          <path d="M5 12h14" />
        </svg>
      )}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-[var(--color-muted)]"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-[var(--color-faint)]"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}
