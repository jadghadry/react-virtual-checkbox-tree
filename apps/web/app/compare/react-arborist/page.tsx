import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/code-block";
import {
  CompareBody,
  CompareFooter,
  CompareHeader,
  Concede,
  FactTable,
  H2,
  VERIFIED_ON,
  Verdict,
} from "@/components/demo-compare-ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "vs react-arborist — react-virtual-checkbox-tree",
  description:
    "react-arborist is virtualized, drag-and-drop capable and excellent — and has no checkboxes. Issue #352 is open. What each one is actually for.",
  alternates: { canonical: "/compare/react-arborist" },
};

const ARBORIST_CHECKBOX = `// react-arborist: the checkbox is yours to build, and so is the cascade.
import { useCallback, useState } from "react";
import { Tree, type NodeApi } from "react-arborist";

type Item = { children?: Item[]; id: string; name: string };

const data: Item[] = [
  { id: "docs", name: "docs", children: [{ id: "readme", name: "README.md" }, { id: "guide", name: "guide.md" }] },
  {
    id: "src",
    name: "src",
    children: [
      { id: "engine", name: "engine.ts" },
      { id: "ui", name: "ui", children: [{ id: "tree", name: "tree.tsx" }, { id: "row", name: "row.tsx" }] },
    ],
  },
];

/** You write this. It is the part that goes wrong at depth 3. */
function leavesUnder(node: NodeApi<Item>): string[] {
  if (node.isLeaf) return [node.id];
  return (node.children ?? []).flatMap(leavesUnder);
}

function stateOf(node: NodeApi<Item>, checked: Set<string>) {
  const leaves = leavesUnder(node); // walks the whole subtree, on every render
  const n = leaves.filter((id) => checked.has(id)).length;
  if (n === 0) return "unchecked";
  return n === leaves.length ? "checked" : "indeterminate";
}

export default function App() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = useCallback((node: NodeApi<Item>, next: boolean) => {
    setChecked((prev) => {
      const out = new Set(prev);
      for (const id of leavesUnder(node)) {
        if (next) out.add(id);
        else out.delete(id);
      }
      return out;
    });
  }, []);

  return (
    <Tree data={data} height={320} rowHeight={32} width={320}>
      {({ node, style }) => {
        const state = stateOf(node, checked);
        return (
          <div style={style}>
            <input
              aria-label={node.data.name}
              checked={state === "checked"}
              onChange={(event) => toggle(node, event.target.checked)}
              ref={(el) => {
                if (el) el.indeterminate = state === "indeterminate";
              }}
              type="checkbox"
            />
            <span onClick={() => node.toggle()}>{node.data.name}</span>
          </div>
        );
      }}
    </Tree>
  );
}`;

const OURS = `// react-virtual-checkbox-tree: the cascade is the library.
import { useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

const data: TreeDefinition = {
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

export default function App() {
  const [checked, setChecked] = useState<string[]>([]);

  return (
    <Tree
      aria-label="Project files"
      checkedItems={checked}
      data={data}
      estimateSize={32}
      height={320}
      onCheck={setChecked}
    />
  );
}`;

export default function Page() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        type="application/ld+json"
      />

      <CompareHeader
        eyebrow="Compare"
        lede="react-arborist has no checkboxes. That is the whole comparison: it is a better file-manager tree than this will ever be, and it does not ship the one thing this library exists to do. Issue #352 — “Tracking: Checkbox selection & indeterminate (parent) state” — is open."
        title="react-virtual-checkbox-tree vs react-arborist"
      />

      <CompareBody>
        <p>
          Both are virtualized. Both are TypeScript-first. Both let you render the row. They part
          company on purpose: react-arborist is built around <em>manipulating</em> a tree — drag to
          reorder, rename in place, create, delete — and its selection model is row selection, the
          kind you get from a file explorer. This library is built around <em>choosing</em> a set of
          leaves, and the tri-state cascade is the entire product.
        </p>
        <p>
          If you are choosing between them and your requirement contains the word
          &ldquo;drag&rdquo;, stop reading and use react-arborist.
        </p>

        <FactTable
          facts={[
            {
              label: "react-arborist version",
              value: "3.16.0, published 2026-07-25",
              source: "https://www.npmjs.com/package/react-arborist",
              sourceLabel: "npm",
            },
            {
              label: "Weekly downloads",
              value: "433,646",
              source: "https://api.npmjs.org/downloads/point/last-week/react-arborist",
              sourceLabel: "npm registry",
            },
            {
              label: "GitHub stars",
              value: "3,704",
              source: "https://github.com/jameskerr/react-arborist",
              sourceLabel: "repo",
            },
            {
              label: "Checkboxes / indeterminate",
              value: "Not built in — #352 open since 2026-06-07",
              source: "https://github.com/jameskerr/react-arborist/issues/352",
              sourceLabel: "#352",
            },
            {
              label: "Virtualization",
              value: "Yes, via react-window",
              source: "https://github.com/jameskerr/react-arborist",
              sourceLabel: "repo",
            },
            {
              label: "Bundle",
              value: "30.8 kB gzipped, 5 dependencies",
              source: "https://bundlephobia.com/package/react-arborist@3.16.0",
              sourceLabel: "Bundlephobia",
            },
            { label: "Licence", value: "MIT, same as this library" },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="Verified facts"
        />

        <H2 id="what-it-does-better">What react-arborist does better</H2>

        <p>Nearly everything that is not a checkbox.</p>

        <Concede title="Ground this library does not hold">
          <ul>
            <li>
              <strong>Drag and drop, properly.</strong> Reordering, dropping into folders, a drop
              cursor you can replace with <code>renderCursor</code>, a drag preview you can replace
              with <code>renderDragPreview</code>. This library has none of it and it is an explicit
              non-goal, not a to-do.
            </li>
            <li>
              <strong>Inline renaming and CRUD.</strong> <code>onCreate</code>, <code>onRename</code>
              , <code>onMove</code>, <code>onDelete</code> and an editing state on every node. That is
              a file manager in a box. Here you would build all of it around the tree.
            </li>
            <li>
              <strong>Range selection.</strong> Shift-click and shift-arrow select a contiguous run
              of rows. This library toggles one row at a time with Space and offers Ctrl/Cmd+A for
              everything — there is no range selection.
            </li>
            <li>
              <strong>A richer node API.</strong> <code>NodeApi</code> gives you{" "}
              <code>node.toggle()</code>, <code>node.edit()</code>, <code>node.select()</code>,{" "}
              <code>node.isEditing</code>, <code>node.nextSibling</code> and the rest, plus a{" "}
              <code>TreeApi</code> for the whole thing. The equivalent here is the{" "}
              <Link href="/docs/api/engine">Engine</Link>, which is deliberately smaller.
            </li>
            <li>
              <strong>Fifty times the install base.</strong> 433,646 downloads a week and 3,704
              stars against eight and a handful. Its edge cases have been found.
            </li>
          </ul>
        </Concede>

        <H2 id="checkboxes">Can I just add checkboxes to react-arborist?</H2>
        <p>
          You can render one, and then you own the tri-state logic. That is more than it sounds. The
          maintainer has consolidated four separate requests —{" "}
          <a href="https://github.com/jameskerr/react-arborist/issues/312" rel="noreferrer noopener" target="_blank">
            #312
          </a>
          ,{" "}
          <a href="https://github.com/jameskerr/react-arborist/issues/173" rel="noreferrer noopener" target="_blank">
            #173
          </a>
          ,{" "}
          <a href="https://github.com/jameskerr/react-arborist/issues/267" rel="noreferrer noopener" target="_blank">
            #267
          </a>{" "}
          and{" "}
          <a href="https://github.com/jameskerr/react-arborist/issues/190" rel="noreferrer noopener" target="_blank">
            #190
          </a>{" "}
          — into a single{" "}
          <a href="https://github.com/jameskerr/react-arborist/issues/352" rel="noreferrer noopener" target="_blank">
            tracking issue #352
          </a>
          , which is the clearest possible signal that people keep wanting this and it is not there
          yet.
        </p>
        <p>
          Here is the honest shape of the DIY version next to the built-in one. The left column is a
          complete, working tri-state cascade — and it is still missing the ARIA tree the right
          column emits (<code>role=&quot;treeitem&quot;</code> with{" "}
          <code>aria-checked=&quot;mixed&quot;</code>, <code>aria-level</code>,{" "}
          <code>aria-setsize</code> and <code>aria-posinset</code>), and{" "}
          <code>leavesUnder()</code> walks the entire subtree on every render of every row.
        </p>

        <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={ARBORIST_CHECKBOX} filename="arborist-checkbox.tsx" />
          <CodeBlock code={OURS} filename="rvct.tsx" />
        </div>

        <p>
          The scaling difference is not the line count, it is <code>leavesUnder()</code>. Recomputing
          a parent&rsquo;s state by walking its descendants is O(subtree) per row per render. This
          library stores selection as sparse assignments and derives state with a memoized
          post-order walk that skips any branch containing no assignments, which is why a cascade
          costs{" "}
          <span className="tnum font-mono">1–3 µs</span> whether the tree holds a thousand nodes or a
          million. The mechanism is in{" "}
          <Link href="/docs/checkbox-semantics">Checkbox semantics</Link>.
        </p>

        <H2 id="together">Can I use both?</H2>
        <p>
          Yes, and it is a reasonable answer. The{" "}
          <code>react-virtual-checkbox-tree/engine</code> entry point ships the flattening, the
          tri-state math and the search filter as a plain class with no React and no virtualizer in
          it. You can drive react-arborist&rsquo;s rendering and let the Engine own the checkbox
          state — <code>engine.getViewState(id)</code> per row, <code>engine.toggle(id, next)</code>{" "}
          on click, <code>engine.subscribe()</code> to re-render. See{" "}
          <Link href="/examples/engine-only">the engine-only example</Link>.
        </p>

        <Verdict
          otherLabel="react-arborist"
          otherWhen="You are building a file explorer, an outline editor, a layers panel, or anything where users move nodes around. Drag-and-drop, inline rename and range selection are all first class there and absent here — and its 433,000 weekly downloads mean the sharp edges are already filed off."
          ourWhen="Selection is the point and manipulation is not: a file picker, a permissions matrix, a faceted filter, an export dialog. You want the indeterminate math, ancestor-aware search and an ARIA tree without writing the cascade — and you are fine having no drag-and-drop at all."
        />

        <CompareFooter slug="react-arborist" />
      </CompareBody>
    </>
  );
}

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: "react-virtual-checkbox-tree vs react-arborist",
        description:
          "A sourced comparison: react-arborist virtualizes and does drag-and-drop but ships no checkboxes or indeterminate state; react-virtual-checkbox-tree does the opposite.",
        url: `${site.url}/compare/react-arborist`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does react-arborist support checkboxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not as a built-in feature. react-arborist has row selection, including shift-range selection, but no checkbox column and no indeterminate parent state. Issue #352, 'Tracking: Checkbox selection & indeterminate (parent) state', is open and consolidates four earlier requests.",
            },
          },
          {
            "@type": "Question",
            name: "Can I add tri-state checkboxes to react-arborist myself?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, by rendering a checkbox in your custom node component and deriving each parent's state from its descendants. The cost is that a naive derivation walks the whole subtree on every render of every row, and you must also set aria-checked and the DOM indeterminate property yourself.",
            },
          },
          {
            "@type": "Question",
            name: "Can react-arborist and react-virtual-checkbox-tree be used together?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The react-virtual-checkbox-tree/engine entry point contains no React and no virtualizer, so its Engine can own the tri-state selection while react-arborist owns rendering, drag-and-drop and renaming.",
            },
          },
        ],
      },
    ],
  };
}
