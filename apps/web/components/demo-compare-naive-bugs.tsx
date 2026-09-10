"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tree, type TreeRef } from "react-virtual-checkbox-tree";

import { TreeSkin } from "@/components/tree-skin";
import { fileTree } from "@/lib/tree-data";

/**
 * Two panes over the same nine-node tree: a hand-rolled checkbox tree on the
 * left, this library on the right, driven by one shared set of checked leaves.
 *
 * The naive implementation here is not a straw man. It is the version almost
 * everyone writes first — cascade down on toggle, bubble a parent up when all of
 * its direct children are checked, derive the parent's display state by counting
 * direct children. It is correct at depth 1 and wrong at depth 2, and that is the
 * point of the first tab.
 */

type State = "checked" | "indeterminate" | "unchecked";

const ALL_LEAVES = Object.keys(fileTree).filter((id) => !fileTree[id].children?.length);

/** The bubble-up a naive implementation writes: a folder joins the set when all its children are in it. */
function naiveSet(leaves: ReadonlyArray<string>): Set<string> {
  const out = new Set(leaves);
  const visit = (id: string): boolean => {
    const children = fileTree[id].children;
    if (!children || children.length === 0) return out.has(id);
    const every = children.map(visit).every(Boolean);
    if (every) out.add(id);
    return every;
  };
  visit("__root__");
  return out;
}

/**
 * The bug. A folder's state is read off its *direct* children only, so a folder
 * whose grandchildren are partly checked reads as fully unchecked.
 */
function naiveState(id: string, set: Set<string>): State {
  const children = fileTree[id].children;
  if (!children || children.length === 0) return set.has(id) ? "checked" : "unchecked";
  const hits = children.filter((child) => set.has(child)).length;
  if (hits === 0) return "unchecked";
  return hits === children.length ? "checked" : "indeterminate";
}

function leavesUnder(id: string): string[] {
  const children = fileTree[id].children;
  if (!children || children.length === 0) return [id];
  return children.flatMap(leavesUnder);
}

/** Ancestor-aware filter, written correctly, so the only difference on tab two is the toggle scope. */
function visibleIds(query: string): null | Set<string> {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;

  const parentOf = new Map<string, string>();
  for (const [id, item] of Object.entries(fileTree)) {
    for (const child of item.children ?? []) parentOf.set(child, id);
  }

  const visible = new Set<string>(["__root__"]);
  for (const [id, item] of Object.entries(fileTree)) {
    if (id === "__root__") continue;
    if (!item.label.toLowerCase().includes(q)) continue;
    visible.add(id);
    for (const descendant of leavesUnder(id)) visible.add(descendant);
    let parent = parentOf.get(id);
    while (parent) {
      visible.add(parent);
      parent = parentOf.get(parent);
    }
  }
  return visible;
}

type Row = { id: string; isFolder: boolean; level: number };

function flatten(visible: null | Set<string>): Row[] {
  const out: Row[] = [];
  const walk = (id: string, level: number) => {
    for (const child of fileTree[id].children ?? []) {
      if (visible && !visible.has(child)) continue;
      const isFolder = Boolean(fileTree[child].children?.length);
      out.push({ id: child, isFolder, level });
      if (isFolder) walk(child, level + 1);
    }
  };
  walk("__root__", 0);
  return out;
}

export function CompareNaiveBugs() {
  const [tab, setTab] = useState<"filtered" | "indeterminate">("indeterminate");
  const [checked, setChecked] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  // The naive pane draws the whole tree, so open the real one to match. Expansion
  // stays uncontrolled on purpose: clearing a query restores whatever the user had.
  const treeRef = useRef<TreeRef>(null);
  useEffect(() => {
    treeRef.current?.expandAll();
  }, []);

  const activeQuery = tab === "filtered" ? query : "";
  const visible = useMemo(() => visibleIds(activeQuery), [activeQuery]);
  const rows = useMemo(() => flatten(visible), [visible]);
  const set = useMemo(() => naiveSet(checked), [checked]);

  // Both panes read one selection, held by the engine. The naive pane writes to it
  // with the naive cascade — every leaf under the node, filter or no filter — and
  // the engine reports back through onCheck.
  const applyLeaves = (leaves: string[]) => {
    treeRef.current?.getEngine().setChecked(leaves);
  };

  const toggleNaive = (id: string, next: boolean) => {
    const affected = leavesUnder(id);
    const out = new Set(checked);
    for (const leaf of affected) {
      if (next) out.add(leaf);
      else out.delete(leaf);
    }
    applyLeaves(ALL_LEAVES.filter((leaf) => out.has(leaf)));
  };

  const srcNaive = naiveState("src", set);
  const bugOne =
    tab === "indeterminate" &&
    srcNaive === "unchecked" &&
    checked.includes("tree") &&
    !checked.includes("row");
  const bugTwo =
    tab === "filtered" &&
    activeQuery.trim().length >= 3 &&
    checked.includes("engine") &&
    checked.includes("tree") &&
    checked.includes("row");

  const naiveNote = bugOne
    ? "src reads unchecked. One of its grandchildren is checked."
    : bugTwo
      ? "It checked engine.ts and row.tsx too — you never saw them."
      : tab === "indeterminate"
        ? "A folder's state is counted off its direct children only."
        : "The cascade has no idea the filter exists.";

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-[var(--color-border)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <Tab active={tab === "indeterminate"} onClick={() => setTab("indeterminate")}>
          Bug 1 — indeterminate at depth 2
        </Tab>
        <Tab active={tab === "filtered"} onClick={() => setTab("filtered")}>
          Bug 3 — select all while filtered
        </Tab>
        <button
          className="ml-auto rounded-md border border-[var(--color-border-strong)] px-2.5 py-1 text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
          onClick={() => {
            applyLeaves([]);
            setQuery("");
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="border-b border-[var(--color-border)] px-3 py-2.5">
        {tab === "indeterminate" ? (
          <p className="text-[13px] leading-relaxed text-[var(--color-muted)]">
            Check <code className="font-mono text-[12px]">tree.tsx</code> in either pane, then look
            at <code className="font-mono text-[12px]">src</code>. Both panes hold the same one
            checked leaf. Only one of them says so.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[13px] text-[var(--color-muted)]" htmlFor="rvct-compare-query">
              Type <code className="font-mono text-[12px]">tree</code>, then click the{" "}
              <code className="font-mono text-[12px]">src</code> checkbox in one pane, Reset, and
              click it in the other:
            </label>
            <input
              className="w-40 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2 py-1 font-mono text-[12px]"
              id="rvct-compare-query"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="tree"
              value={query}
            />
            <span className="text-[12px] text-[var(--color-faint)]">3 characters minimum</span>
          </div>
        )}
      </div>

      <div className="grid gap-px bg-[var(--color-border)] sm:grid-cols-2">
        <Pane
          note={naiveNote}
          state={bugOne || bugTwo ? "wrong" : "idle"}
          title="Hand-rolled"
        >
          <div className="px-2 py-1.5 font-mono">
            {rows.map((row) => {
              const state = naiveState(row.id, set);
              return (
                <button
                  className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                  key={row.id}
                  onClick={() => toggleNaive(row.id, state !== "checked")}
                  style={{ paddingInlineStart: row.level * 20 + 4 }}
                  type="button"
                >
                  <input
                    aria-hidden="true"
                    checked={state === "checked"}
                    onChange={() => {
                      /* the row owns the interaction */
                    }}
                    ref={(el) => {
                      if (el) el.indeterminate = state === "indeterminate";
                    }}
                    tabIndex={-1}
                    type="checkbox"
                  />
                  <span
                    className={`text-[13px] ${
                      row.isFolder
                        ? "font-medium text-[var(--color-fg)]"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
                    {fileTree[row.id].label}
                  </span>
                </button>
              );
            })}
            {rows.length === 0 && (
              <p className="px-1 py-2 text-[13px] text-[var(--color-faint)]">No matches.</p>
            )}
          </div>
        </Pane>

        <Pane
          note={
            tab === "indeterminate"
              ? "Post-order derivation, memoized, skipping branches with no assignments."
              : "While filtered, a toggle walks the visible children only."
          }
          state="right"
          title="react-virtual-checkbox-tree"
        >
          <TreeSkin>
            <Tree
              aria-label="Project files"
              data={fileTree}
              estimateSize={28}
              height={rows.length * 28 + 8}
              minSearchChars={3}
              onCheck={setChecked}
              ref={treeRef}
              searchQuery={activeQuery}
            />
          </TreeSkin>
        </Pane>
      </div>

      <div className="border-t border-[var(--color-border)] px-3 py-2 font-mono text-[12px] text-[var(--color-faint)]">
        <span className="text-[var(--color-muted)]">checked leaves</span>{" "}
        <span className="tnum text-[var(--color-fg)]">
          [{checked.map((id) => fileTree[id].label).join(", ")}]
        </span>
      </div>
    </div>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-md px-2.5 py-1 text-[12.5px] transition-colors ${
        active
          ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
          : "border border-[var(--color-border-strong)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Pane({
  children,
  note,
  state,
  title,
}: {
  children: React.ReactNode;
  note: string;
  state: "idle" | "right" | "wrong";
  title: string;
}) {
  const color =
    state === "wrong"
      ? "var(--color-warn)"
      : state === "right"
        ? "var(--color-ok)"
        : "var(--color-faint)";
  return (
    <div className="bg-[var(--color-bg)]">
      <p className="border-b border-[var(--color-border)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-faint)]">
        {title}
      </p>
      <div className="min-h-[180px]">{children}</div>
      <p className="border-t border-[var(--color-border)] px-3 py-1.5 text-[12px]" style={{ color }}>
        {note}
      </p>
    </div>
  );
}
