import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { EngineOnlyDemo } from "@/components/demo-ex-engine-only";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";
import { bundleSize } from "@/lib/site";

export const metadata: Metadata = {
  title: "Engine without React — react-virtual-checkbox-tree",
  description:
    "Use the headless Engine directly: import from the /engine entry point, subscribe with useSyncExternalStore, and render every row yourself.",
  alternates: { canonical: "/examples/engine-only" },
};

const SOURCE = `"use client";

import type { KeyboardEvent } from "react";

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import { CheckedState, Engine } from "react-virtual-checkbox-tree/engine";

const files = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs:     { id: "docs", label: "docs", children: ["readme", "guide"] },
  readme:   { id: "readme", label: "README.md" },
  guide:    { id: "guide", label: "guide.md" },
  src:      { id: "src", label: "src", children: ["engine", "ui"] },
  engine:   { id: "engine", label: "engine.ts" },
  ui:       { id: "ui", label: "ui", children: ["tree", "row"] },
  tree:     { id: "tree", label: "tree.tsx" },
  row:      { id: "row", label: "row.tsx" },
};

export function HandRolledTree() {
  // One engine for the life of the component. Rebuilding it on every render
  // would throw away the selection and the open folders.
  const [engine] = useState(
    () => new Engine(files, { initialExpanded: ["docs", "src", "ui"] })
  );
  const [activeId, setActiveId] = useState<null | string>(null);
  const reactId = useId();
  const domId = (id: string) => reactId + "-" + id;

  const subscribe = useCallback((cb: () => void) => engine.subscribe(cb), [engine]);

  // Two counters in one string. structureVersion changes when rows move,
  // appear or disappear; selectionVersion changes when only the boxes do.
  // Returning a plain string keeps getSnapshot referentially stable by value,
  // which is what useSyncExternalStore requires.
  const snapshot = useCallback(
    () => engine.getStructureVersion() + ":" + engine.getSelectionVersion(),
    [engine]
  );
  useSyncExternalStore(subscribe, snapshot, snapshot);

  const rows = engine.getVisibleItems();
  const move = (index: number) => {
    if (index < 0 || index >= rows.length) return;
    setActiveId(rows[index].id);
  };

  // Every one of these lines is behaviour <Tree> would have given you.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = activeId ? engine.indexOf(activeId) : -1;
    const row = index >= 0 ? rows[index] : null;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        return move(index < 0 ? 0 : index + 1);
      case "ArrowUp":
        event.preventDefault();
        return move(index < 0 ? rows.length - 1 : index - 1);
      case "ArrowRight":
        event.preventDefault();
        if (!row || !row.isFolder) return;
        if (!row.isExpanded) engine.setExpandedFor(row.id, true);
        else move(index + 1);
        return;
      case "ArrowLeft": {
        event.preventDefault();
        if (!row) return;
        if (row.isFolder && row.isExpanded) return engine.setExpandedFor(row.id, false);
        const parent = engine.getParent(row.id);
        if (parent) move(engine.indexOf(parent));
        return;
      }
      case "Home":
        event.preventDefault();
        return move(0);
      case "End":
        event.preventDefault();
        return move(rows.length - 1);
      case " ":
        if (!row) return;
        event.preventDefault();
        engine.toggle(row.id, engine.getViewState(row.id) !== CheckedState.Checked);
        return;
      default:
        return;
    }
  };

  return (
    <div
      aria-activedescendant={activeId ? domId(activeId) : undefined}
      aria-label="Project files"
      aria-multiselectable
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
            // aria-level is 1-based; row.level is 0-based.
            aria-level={row.level + 1}
            aria-posinset={row.posInSet}
            aria-setsize={row.setSize}
            id={domId(row.id)}
            key={row.id}
            onClick={() => {
              setActiveId(row.id);
              if (row.isFolder) engine.toggleExpanded(row.id);
              else engine.toggle(row.id, state !== CheckedState.Checked);
            }}
            role="treeitem"
            style={{ paddingLeft: row.level * 18 + 8 }}
          >
            <span aria-hidden="true">{row.isFolder ? (row.isExpanded ? "−" : "+") : " "}</span>
            <span aria-hidden="true">
              {state === CheckedState.Checked
                ? "☑"
                : state === CheckedState.Indeterminate
                  ? "▣"
                  : "☐"}
            </span>
            {engine.getLabel(row.id)}
          </div>
        );
      })}
    </div>
  );
}`;

const SERVER = `// Runs in Node, in a Server Component, or in a test. No React involved.
import { CheckedState, Engine } from "react-virtual-checkbox-tree/engine";

import { files } from "./files";

const engine = new Engine(files);

engine.toggle("src", true);
engine.getAllChecked();          // ["row", "tree", "engine"] — leaves only, in
                                 // traversal order, never folder IDs
engine.getState("src");          // CheckedState.Checked
engine.getCheckedSubtrees();     // [{ id: "src", checked: true }] — one row to persist
engine.getNodeCount();           // 8
engine.getLeafCount();           // 5

engine.setSearchQuery("tree");
engine.isSearchActive();         // true
engine.getMatchCount();          // 1
engine.getVisibleItems().map((row) => row.id);  // ["src", "ui", "tree"]`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="You need the tri-state math, the flattening and the ancestor-aware search, but not the rows the library renders — because you have a table, a canvas, a mobile list, or a design system that owns row markup outright. So take the engine and leave the renderer."
        title="Engine only"
        why="The hard part of a checkbox tree is not the DOM, it is keeping every ancestor's state correct while a selection cascades through a hundred thousand descendants. That part is a plain class with a subscribe() method, and it does not care what draws the result."
      />

      <ExampleBody>
        <ExampleSection
          lede="No <Tree> on this page. The rows below are a map() over getVisibleItems(), re-rendered through useSyncExternalStore."
          title="The demo"
        >
          <DemoFrame note="Click to expand or check, or focus the list and use the arrow keys and Space — behaviour that exists here only because it is written out below.">
            <EngineOnlyDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="Complete, including the keyboard map. This is the honest total cost of the headless route."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="hand-rolled-tree.tsx" />
        </ExampleSection>

        <ExampleSection
          lede={`The /engine entry point carries no "use client" banner and no React import: ${bundleSize.engine} gzipped, against ${bundleSize.full} for the full component — and it drops the @tanstack/react-virtual dependency, which neither figure counts, on top of that.`}
          title="The same engine on the server"
        >
          <CodeBlock code={SERVER} filename="derive-selection.ts" lang="ts" />
        </ExampleSection>

        <ExampleSection title="API exercised">
          <PropsExercised
            items={[
              {
                name: "new Engine(data, opts)",
                note: "opts takes initialExpanded, minSearchChars, rootId and searchScope. The root is always expanded and never rendered.",
              },
              {
                name: "subscribe(cb)",
                note: "Fires on every change and returns an unsubscribe function. Pair it with useSyncExternalStore, or call it from anything at all.",
              },
              {
                name: "getStructureVersion() / getSelectionVersion()",
                note: "Two counters, deliberately separate: a selection change moves no rows, so the flattened list stays cached across every click.",
              },
              {
                name: "getVisibleItems()",
                note: "The flattened rows: { id, isExpanded, isFolder, level, posInSet, setSize }. posInSet and setSize exist because a virtualized tree has no group wrappers for a screen reader to count.",
              },
              {
                name: "getViewState(id)",
                note: "The state to render, summarizing only search-visible children while a query is active. getState(id) ignores the filter and answers against the whole tree.",
              },
              {
                name: "toggle / setExpandedFor / indexOf / getParent",
                note: "Everything the keyboard handler needs. indexOf returns -1 for a node that is not currently visible.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="You now own the ARIA — and the virtualization" type="warn">
            <p>
              The engine hands you <code>level</code>, <code>posInSet</code> and{" "}
              <code>setSize</code> precisely so you can build a correct tree, but it emits no
              markup and therefore no accessibility. Going this route you are responsible for{" "}
              <code>role=&quot;tree&quot;</code> plus <code>aria-multiselectable</code> on the
              container; <code>role=&quot;treeitem&quot;</code> with <code>aria-level</code>,{" "}
              <code>aria-setsize</code>, <code>aria-posinset</code> and a tri-state{" "}
              <code>aria-checked</code> of <code>&quot;true&quot;</code> /{" "}
              <code>&quot;false&quot;</code> / <code>&quot;mixed&quot;</code> on every row; and the
              whole keyboard map.
            </p>
            <p>
              Keep focus on the container and point <code>aria-activedescendant</code> at the active
              row. Putting real DOM focus on a row works right up until a virtualizer unmounts that
              row, at which point focus falls back to <code>{"<body>"}</code> and keyboard
              navigation ends. That is the bug this pattern exists to prevent.
            </p>
            <p>
              And note what is missing above: virtualization. The demo renders every visible row,
              which is fine for nine nodes and not fine for ninety thousand. If you go headless at
              scale, wiring up{" "}
              <code>@tanstack/react-virtual</code> over <code>getVisibleItems()</code> is your job
              too — that is exactly the work <code>{"<Tree>"}</code> is.
            </p>
          </Callout>
        </ExampleSection>

        <ExampleNav
          next={{ href: "/examples/async-pages", label: "Paged loading" }}
          prev={{ href: "/examples/faceted-filter", label: "Faceted filter" }}
        />
      </ExampleBody>
    </>
  );
}
