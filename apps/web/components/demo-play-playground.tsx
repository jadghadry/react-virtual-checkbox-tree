"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Tree,
  type TreeCheckboxRenderProps,
  type TreeItemRenderProps,
  type TreeRef,
} from "react-virtual-checkbox-tree";

import { CopyButton } from "@/components/copy-button";
import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { BASE_COLOR, tokenizeTsx, tokenStyle } from "@/lib/highlight-tsx";
import { generateTree } from "@/lib/tree-data";

// ---------------------------------------------------------------------------
// Knob state
// ---------------------------------------------------------------------------

type Knobs = {
  /** Swap the default checkbox for a custom one via `renderCheckbox`. */
  checkbox: boolean;
  /** Hold the selection in React state and feed it back through `checkedItems`. */
  controlled: boolean;
  /** `height` prop, in pixels. */
  height: number;
  /** Render folder/file glyphs via `renderItem`. */
  icons: boolean;
  /** `indent` prop, in pixels per level. */
  indent: number;
  /** `minSearchChars` prop. */
  minChars: number;
  /** How many nodes `generateTree` should produce. */
  nodes: number;
  /** `overscan` prop. */
  overscan: number;
  /** `estimateSize` prop, in pixels. */
  rowHeight: number;
  /** `searchScope` prop. */
  scope: "all" | "leaves";
};

/**
 * Starting values for the panel. `indent`, `minChars`, `overscan`, `rowHeight`
 * and `scope` are the library's own defaults, verbatim from `tree.tsx`, and the
 * generated snippet omits any prop still sitting on one — so the code shrinks as
 * you undo knobs, which is the fastest way to learn what you actually have to
 * pass. The rest are this page's choices: `height` defaults to `"100%"` in the
 * library, and `icons`, `checkbox`, `controlled` and `nodes` are not props.
 */
const DEFAULTS: Knobs = {
  checkbox: false,
  controlled: false,
  height: 420,
  icons: true,
  indent: 20,
  minChars: 3,
  nodes: 10_000,
  overscan: 8,
  rowHeight: 32,
  scope: "all",
};

const NODE_SIZES = [1_000, 10_000, 100_000] as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ---------------------------------------------------------------------------
// URL <-> state. About twenty lines and no extra dependency, which is what makes
// a playground configuration something you can paste into an issue.
// ---------------------------------------------------------------------------

function decodeKnobs(params: URLSearchParams): Knobs {
  const int = (key: string, fallback: number, lo: number, hi: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? fallback : clamp(n, lo, hi);
  };
  const bool = (key: string, fallback: boolean) => {
    const raw = params.get(key);
    return raw === null ? fallback : raw === "1";
  };

  const nodes = int("nodes", DEFAULTS.nodes, 1_000, 100_000);

  return {
    checkbox: bool("checkbox", DEFAULTS.checkbox),
    controlled: bool("controlled", DEFAULTS.controlled),
    height: int("height", DEFAULTS.height, 240, 640),
    icons: bool("icons", DEFAULTS.icons),
    indent: int("indent", DEFAULTS.indent, 12, 36),
    minChars: int("minChars", DEFAULTS.minChars, 1, 5),
    nodes: NODE_SIZES.includes(nodes as (typeof NODE_SIZES)[number]) ? nodes : DEFAULTS.nodes,
    overscan: int("overscan", DEFAULTS.overscan, 0, 30),
    rowHeight: int("rowHeight", DEFAULTS.rowHeight, 24, 64),
    scope: params.get("scope") === "leaves" ? "leaves" : DEFAULTS.scope,
  };
}

/** Only non-default knobs reach the URL, so a stock configuration has a clean link. */
function encodeKnobs(knobs: Knobs): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULTS) as Array<keyof Knobs>) {
    const value = knobs[key];
    if (value === DEFAULTS[key]) continue;
    params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  return params.toString();
}

// ---------------------------------------------------------------------------
// Snippet generation
// ---------------------------------------------------------------------------

const SNIPPET_DATA = `const data: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs:     { id: "docs", label: "docs", children: ["readme", "guide"] },
  readme:   { id: "readme", label: "README.md" },
  guide:    { id: "guide", label: "guide.md" },
  src:      { id: "src", label: "src", children: ["engine", "ui"] },
  engine:   { id: "engine", label: "engine.ts" },
  ui:       { id: "ui", label: "ui", children: ["tree", "row"] },
  tree:     { id: "tree", label: "tree.tsx" },
  row:      { id: "row", label: "row.tsx" },
};`;

// Hoisted to module scope on purpose, and the generated snippet prints them the
// same way. <Tree> memoizes each row and compares the render props by identity,
// so an inline arrow passed to renderCheckbox/renderItem is a new function on
// every parent render and re-renders every mounted row. Defining them once costs
// nothing and is the difference between the virtualizer helping and not.
const SNIPPET_CHECKBOX_FN = `// Defined once, outside the component. Passing an inline arrow here would give
// every row a new prop identity on each render and defeat the row memoization.
function CheckboxGlyph({ a11yProps, checkedState }: TreeCheckboxRenderProps) {
  // a11yProps is { "aria-hidden": true, tabIndex: -1 }. Spread it: the row
  // carries role="treeitem" and aria-checked, so a focusable, announced
  // checkbox inside it would double every row.
  return (
    <span
      {...a11yProps}
      style={{
        alignItems: "center",
        background: checkedState === "checked" ? "#4f9cf9" : "transparent",
        border: "1px solid",
        borderColor: checkedState === "unchecked" ? "#6b6b6b" : "#4f9cf9",
        borderRadius: 3,
        color: checkedState === "checked" ? "#0b1220" : "#4f9cf9",
        display: "inline-flex",
        fontSize: 9,
        height: 13,
        justifyContent: "center",
        width: 13,
      }}
    >
      {checkedState === "checked" ? "✓" : checkedState === "indeterminate" ? "–" : ""}
    </span>
  );
}`;

const SNIPPET_ITEM_FN = `// Also defined once, for the same reason.
function FileRow({ isFolder, item }: TreeItemRenderProps) {
  return (
    <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
      <span aria-hidden="true">{isFolder ? "\u{1F4C1}" : "\u{1F4C4}"}</span>
      {item.label}
    </span>
  );
}`;

function buildSnippet(knobs: Knobs): string {
  const props: string[] = [];
  const push = (line: string) => props.push(`        ${line}`);

  push(`aria-label="Project files"`);
  if (knobs.controlled) push(`checkedItems={checked}`);
  push(`data={data}`);
  if (knobs.rowHeight !== DEFAULTS.rowHeight) push(`estimateSize={${knobs.rowHeight}}`);
  push(`height={${knobs.height}}`);
  if (knobs.indent !== DEFAULTS.indent) push(`indent={${knobs.indent}}`);
  if (knobs.minChars !== DEFAULTS.minChars) push(`minSearchChars={${knobs.minChars}}`);
  push(
    knobs.controlled
      ? `onCheck={setChecked}`
      : `onCheck={(leafIds) => console.log(leafIds.length, "leaves checked")}`
  );
  if (knobs.overscan !== DEFAULTS.overscan) push(`overscan={${knobs.overscan}}`);
  if (knobs.checkbox) push(`renderCheckbox={CheckboxGlyph}`);
  if (knobs.icons) push(`renderItem={FileRow}`);
  push(`searchQuery={query}`);
  if (knobs.scope !== DEFAULTS.scope) push(`searchScope="${knobs.scope}"`);

  const renderers = [
    knobs.checkbox ? SNIPPET_CHECKBOX_FN : null,
    knobs.icons ? SNIPPET_ITEM_FN : null,
  ]
    .filter(Boolean)
    .map((block) => `\n${block}\n`)
    .join("");

  const typeImports = [
    knobs.checkbox ? "\n  type TreeCheckboxRenderProps," : "",
    knobs.icons ? "\n  type TreeItemRenderProps," : "",
  ].join("");

  const stateLines = [`  const [query, setQuery] = useState("");`];
  if (knobs.controlled) stateLines.push(`  const [checked, setChecked] = useState<string[]>([]);`);

  return `"use client";

import { useState } from "react";
import {
  Tree,
  type TreeDefinition,${typeImports}
} from "react-virtual-checkbox-tree";

// The canonical example tree. The preview above is running ${knobs.nodes.toLocaleString()} generated
// nodes; these eight nodes plus the never-rendered "__root__" are here so the
// snippet pastes and runs as-is.
${SNIPPET_DATA}
${renderers}
export function FileTree() {
${stateLines.join("\n")}

  return (
    <>
      <input
        aria-label="Filter files"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter…"
        value={query}
      />
      <Tree
${props.join("\n")}
      />
    </>
  );
}
`;
}

// ---------------------------------------------------------------------------
// Live renderers. These bodies are the same code the generated snippet prints —
// inline styles and all — so the thing you copy is the thing you are looking at.
// ---------------------------------------------------------------------------

function renderCustomCheckbox({ a11yProps, checkedState }: TreeCheckboxRenderProps) {
  return (
    <span
      {...a11yProps}
      style={{
        alignItems: "center",
        background: checkedState === "checked" ? "#4f9cf9" : "transparent",
        border: "1px solid",
        borderColor: checkedState === "unchecked" ? "#6b6b6b" : "#4f9cf9",
        borderRadius: 3,
        color: checkedState === "checked" ? "#0b1220" : "#4f9cf9",
        display: "inline-flex",
        fontSize: 9,
        height: 13,
        justifyContent: "center",
        width: 13,
      }}
    >
      {checkedState === "checked" ? "✓" : checkedState === "indeterminate" ? "–" : ""}
    </span>
  );
}

function renderIconItem({ isFolder, item }: TreeItemRenderProps) {
  return (
    <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
      <span aria-hidden="true">{isFolder ? "\u{1F4C1}" : "\u{1F4C4}"}</span>
      {item.label}
    </span>
  );
}

// ---------------------------------------------------------------------------

type Snapshot = {
  checked: Array<{ checked: boolean; id: string }>;
  expanded: string[];
};

export function Playground() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read once. `searchParams` gets a fresh identity on every navigation, and the
  // panel is the source of truth from here on — the URL only mirrors it.
  const [knobs, setKnobs] = useState<Knobs>(() =>
    decodeKnobs(new URLSearchParams(searchParams.toString()))
  );

  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [mountedRows, setMountedRows] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [matchCount, setMatchCount] = useState<null | number>(null);
  const [isPending, startTransition] = useTransition();

  const treeRef = useRef<TreeRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  // ---- URL sync ---------------------------------------------------------
  useEffect(() => {
    const id = window.setTimeout(() => {
      const qs = encodeKnobs(knobs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => window.clearTimeout(id);
  }, [knobs, pathname, router]);

  const update = useCallback(
    (patch: Partial<Knobs>) => setKnobs((prev) => ({ ...prev, ...patch })),
    []
  );

  // ---- data -------------------------------------------------------------
  const { data, folderCount, leafCount, nodeCount } = useMemo(
    () => generateTree(knobs.nodes),
    [knobs.nodes]
  );

  // Open the first few branches so the tree reads as a tree on arrival.
  useEffect(() => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    for (const row of engine.getVisibleItems().slice(0, 3)) {
      if (row.isFolder) engine.setExpandedFor(row.id, true);
    }
  }, [data, knobs.rowHeight]);

  // ---- estimateSize needs a remount ------------------------------------
  // TanStack Virtual (virtual-core 3.17.9) memoizes its measurements on
  // `count`, `getItemKey`, `gap` and a few other options — `estimateSize` is not
  // one of them. A new row height therefore sits unused until something else
  // invalidates that memo, such as the row count changing when a folder opens,
  // which reads as a broken knob. Remounting applies it immediately. Remounting
  // builds a new Engine too, so the selection and the open folders are captured
  // first and restored after — with `getCheckedSubtrees()`, which is one entry
  // per explicit assignment rather than one per checked leaf.
  const pendingRestore = useRef<null | Snapshot>(null);

  const commitRowHeight = useCallback(
    (next: number) => {
      if (next === knobs.rowHeight) return;
      const engine = treeRef.current?.getEngine();
      if (engine) {
        pendingRestore.current = {
          checked: engine.getCheckedSubtrees(),
          expanded: engine.getExpanded(),
        };
      }
      update({ rowHeight: next });
    },
    [knobs.rowHeight, update]
  );

  useEffect(() => {
    const snapshot = pendingRestore.current;
    if (!snapshot) return;
    pendingRestore.current = null;
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    engine.setExpanded(snapshot.expanded);
    engine.setCheckedSubtrees(snapshot.checked);
  }, [knobs.rowHeight]);

  // A draft value so dragging the slider does not rebuild the engine forty
  // times on the way to 48 pixels.
  const [rowHeightDraft, setRowHeightDraft] = useState(knobs.rowHeight);
  useEffect(() => setRowHeightDraft(knobs.rowHeight), [knobs.rowHeight]);

  // ---- live metrics -----------------------------------------------------
  const measure = useCallback(() => {
    setMountedRows(containerRef.current?.querySelectorAll("[data-rvct-row]").length ?? 0);
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    setVisibleRows(engine.getVisibleItems().length);
    setMatchCount(engine.isSearchActive() ? engine.getMatchCount() : null);
  }, []);

  useEffect(() => {
    measure();
    const id = window.setInterval(measure, 400);
    return () => window.clearInterval(id);
  }, [measure]);

  // ---- toolbar ----------------------------------------------------------
  const withEngine = (fn: (engine: ReturnType<TreeRef["getEngine"]>) => void) => () => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    fn(engine);
    requestAnimationFrame(measure);
  };

  const snippet = useMemo(() => buildSnippet(knobs), [knobs]);
  const tokens = useMemo(() => tokenizeTsx(snippet), [snippet]);
  const isDefault = encodeKnobs(knobs) === "";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---- tree ---------------------------------------------------- */}
        <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
            <input
              aria-label="Filter the tree"
              className="min-w-[160px] flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 font-mono text-[13px] outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Filter ${nodeCount.toLocaleString()} nodes…`}
              value={query}
            />
            <div className="flex flex-wrap gap-1.5">
              <ToolbarButton onClick={withEngine((engine) => engine.expandAll())}>
                Expand all
              </ToolbarButton>
              <ToolbarButton onClick={withEngine((engine) => engine.collapseAll())}>
                Collapse all
              </ToolbarButton>
              <ToolbarButton onClick={withEngine((engine) => engine.checkAll())}>
                Select all
              </ToolbarButton>
              <ToolbarButton onClick={withEngine((engine) => engine.uncheckAll())}>
                Clear
              </ToolbarButton>
            </div>
          </div>

          <TreeSkin>
            <div className="relative" ref={containerRef}>
              {isPending && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--color-surface)]/80 font-mono text-[12px] text-[var(--color-muted)]">
                  building the tree&#8230;
                </div>
              )}
              <Tree
                aria-label="Generated source tree"
                checkedItems={knobs.controlled ? checked : undefined}
                data={data}
                estimateSize={knobs.rowHeight}
                height={knobs.height}
                indent={knobs.indent}
                key={`rows-${knobs.rowHeight}`}
                minSearchChars={knobs.minChars}
                onCheck={setChecked}
                overscan={knobs.overscan}
                ref={treeRef}
                renderCheckbox={knobs.checkbox ? renderCustomCheckbox : undefined}
                renderItem={knobs.icons ? renderIconItem : undefined}
                searchQuery={deferredQuery}
                searchScope={knobs.scope}
              />
            </div>
          </TreeSkin>

          <MetricBar>
            <Metric label="nodes" value={nodeCount.toLocaleString()} />
            <Metric label="folders" value={folderCount.toLocaleString()} />
            <Metric label="leaves" value={leafCount.toLocaleString()} />
            <Metric
              label="rows expanded"
              title="engine.getVisibleItems().length — every row the flattened view currently holds, whether or not it is on screen."
              value={visibleRows.toLocaleString()}
            />
            <Metric
              accent
              label="rows in the DOM"
              title="Counted with querySelectorAll('[data-rvct-row]') on the live document."
              value={mountedRows.toLocaleString()}
            />
            <Metric label="checked" value={checked.length.toLocaleString()} />
            <Metric
              label="matches"
              title="engine.getMatchCount() — nodes whose label matched. Dashes mean the query is shorter than minSearchChars."
              value={matchCount === null ? "—" : matchCount.toLocaleString()}
            />
          </MetricBar>

          <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-[12px] text-[var(--color-faint)]">
            Click the tree, then try ArrowUp / ArrowDown, ArrowLeft / ArrowRight, Home, End, Space,
            Enter, <code className="font-mono">*</code> to expand everything,{" "}
            <code className="font-mono">Ctrl/Cmd+A</code> to select or clear, or just start typing to
            jump by label. Focus stays on the container and moves with{" "}
            <code className="font-mono">aria-activedescendant</code>.
          </p>
        </div>

        {/* ---- knobs --------------------------------------------------- */}
        <aside className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Props
            </h2>
            <button
              className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-40"
              disabled={isDefault}
              onClick={() => {
                // Only a row-height change remounts the tree, so only then is
                // there anything to restore. Capturing otherwise would leave a
                // stale snapshot sitting in the ref.
                const engine =
                  knobs.rowHeight === DEFAULTS.rowHeight ? null : treeRef.current?.getEngine();
                if (engine) {
                  pendingRestore.current = {
                    checked: engine.getCheckedSubtrees(),
                    expanded: engine.getExpanded(),
                  };
                }
                startTransition(() => setKnobs(DEFAULTS));
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            <Knob hint="Generated with a seeded PRNG, so the same size is the same tree." label="nodes">
              <Segmented
                label="Number of generated nodes"
                onChange={(value) => startTransition(() => update({ nodes: Number(value) }))}
                options={NODE_SIZES.map((n) => ({
                  label: n >= 1_000 ? `${n / 1000}k` : String(n),
                  value: String(n),
                }))}
                value={String(knobs.nodes)}
              />
            </Knob>

            <Knob
              hint="estimateSize — a number, or (index) => number. Committed on release: the virtualizer does not key its measurement cache on it, so this page remounts the tree to apply a new height at once."
              label="estimateSize"
              value={`${rowHeightDraft}px`}
            >
              <Slider
                label="estimateSize, row height in pixels"
                max={64}
                min={24}
                onChange={setRowHeightDraft}
                onCommit={commitRowHeight}
                value={rowHeightDraft}
              />
            </Knob>

            <Knob hint="indent — pixels added per level. Defaults to 20." label="indent" value={`${knobs.indent}px`}>
              <Slider
                label="indent, pixels per level"
                max={36}
                min={12}
                onChange={(n) => update({ indent: n })}
                value={knobs.indent}
              />
            </Knob>

            <Knob hint="height — the scroll container. Defaults to 100%." label="height" value={`${knobs.height}px`}>
              <Slider
                label="height, scroll container in pixels"
                max={640}
                min={240}
                onChange={(n) => update({ height: n })}
                step={20}
                value={knobs.height}
              />
            </Knob>

            <Knob
              hint="overscan — rows kept mounted above and below the viewport. Defaults to 8. Watch the DOM count."
              label="overscan"
              value={String(knobs.overscan)}
            >
              <Slider
                label="overscan, extra rows kept mounted"
                max={30}
                min={0}
                onChange={(n) => update({ overscan: n })}
                value={knobs.overscan}
              />
            </Knob>

            <Knob
              hint="minSearchChars — shorter queries are ignored entirely. Defaults to 3."
              label="minSearchChars"
              value={String(knobs.minChars)}
            >
              <Slider
                label="minSearchChars, minimum query length"
                max={5}
                min={1}
                onChange={(n) => update({ minChars: n })}
                value={knobs.minChars}
              />
            </Knob>

            <Knob
              hint={
                knobs.scope === "all"
                  ? "The default. Every label matches, and a matching folder brings its whole subtree along."
                  : "Only leaf labels match. Folders appear because they contain a match."
              }
              label="searchScope"
            >
              <Segmented
                label="searchScope"
                onChange={(value) => update({ scope: value as Knobs["scope"] })}
                options={[
                  { label: "all", value: "all" },
                  { label: "leaves", value: "leaves" },
                ]}
                value={knobs.scope}
              />
            </Knob>

            <Knob
              hint="renderCheckbox with a11yProps spread onto the control — without that spread, screen readers announce every row twice."
              label="renderCheckbox"
            >
              <Toggle
                label="custom checkbox"
                onChange={(next) => update({ checkbox: next })}
                value={knobs.checkbox}
              />
            </Knob>

            <Knob hint="renderItem replaces the row body. It receives an object, not the item." label="renderItem">
              <Toggle label="file icons" onChange={(next) => update({ icons: next })} value={knobs.icons} />
            </Knob>

            <Knob
              hint={
                knobs.controlled
                  ? "checkedItems is passed back in. The engine ignores an echo identical to what it already holds, so this cannot loop."
                  : "No checkedItems prop. The engine owns the selection and onCheck reports it."
              }
              label="controlled"
            >
              <Toggle
                label={knobs.controlled ? "controlled" : "uncontrolled"}
                onChange={(next) => update({ controlled: next })}
                value={knobs.controlled}
              />
            </Knob>
          </div>

          <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-[12px] text-[var(--color-faint)]">
            Every knob you move off its default lands in the address bar. Copy the URL to hand
            someone this exact configuration.
          </p>
        </aside>
      </div>

      {/* ---- generated code --------------------------------------------- */}
      <figure className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <figcaption className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-1.5">
          <span className="font-mono text-[11px] text-[var(--color-faint)]">
            FileTree.tsx &#183; regenerated from the knobs above
          </span>
          <CopyButton label="Copy the generated component" text={snippet} />
        </figcaption>
        {/* `.shiki` so the theme rules in globals.css — the ones that map
            --shiki-dark / --shiki-light onto `color` — apply here exactly as
            they do to the Shiki-rendered blocks in the docs. */}
        <pre
          className="shiki overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7]"
          style={{ "--shiki-dark": BASE_COLOR[0], "--shiki-light": BASE_COLOR[1] } as CSSProperties}
        >
          <code>
            {tokens.map((token, index) => (
              <span key={index} style={tokenStyle(token.kind) as CSSProperties}>
                {token.text}
              </span>
            ))}
          </code>
        </pre>
      </figure>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knob primitives
// ---------------------------------------------------------------------------

function Knob({
  children,
  hint,
  label,
  value,
}: {
  children: React.ReactNode;
  hint: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[12px] text-[var(--color-fg)]">{label}</span>
        {value && <span className="tnum font-mono text-[12px] text-[var(--color-accent)]">{value}</span>}
      </div>
      <div className="mt-2">{children}</div>
      <p className="mt-2 text-[11.5px] leading-snug text-[var(--color-faint)]">{hint}</p>
    </div>
  );
}

function Slider({
  label,
  max,
  min,
  onChange,
  onCommit,
  step = 1,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  step?: number;
  value: number;
}) {
  const commit = () => onCommit?.(value);
  return (
    <input
      aria-label={label}
      className="w-full accent-[var(--color-accent)]"
      max={max}
      min={min}
      onBlur={commit}
      onChange={(event) => onChange(Number(event.target.value))}
      onKeyUp={commit}
      onPointerUp={commit}
      step={step}
      type="range"
      value={value}
    />
  );
}

function Segmented({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex overflow-hidden rounded-md border border-[var(--color-border)]"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`flex-1 px-2 py-1.5 font-mono text-[12px] transition-colors ${
            value === option.value
              ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
              : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <button
      aria-pressed={value}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1.5 text-left text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)]"
      onClick={() => onChange(!value)}
      type="button"
    >
      <span
        className="relative h-[14px] w-[26px] shrink-0 rounded-full transition-colors"
        style={{
          background: value ? "var(--color-accent)" : "var(--color-border-strong)",
        }}
      >
        <span
          className="absolute top-[2px] size-[10px] rounded-full bg-[var(--color-bg)] transition-[left] duration-150"
          style={{ left: value ? 14 : 2 }}
        />
      </span>
      <span className="font-mono">{label}</span>
    </button>
  );
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
