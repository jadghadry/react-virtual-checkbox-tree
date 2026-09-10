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
  title: "vs react-checkbox-tree — react-virtual-checkbox-tree",
  description:
    "react-checkbox-tree renders every node; issue #43 has been open since 2017. What it still does better, and what changes if you migrate.",
  alternates: { canonical: "/compare/react-checkbox-tree" },
};

const THEIRS = `// npm i react-checkbox-tree
import { useState } from "react";
import CheckboxTree from "react-checkbox-tree";
import "react-checkbox-tree/lib/react-checkbox-tree.css";

const nodes = [
  {
    value: "docs",
    label: "docs",
    children: [
      { value: "readme", label: "README.md" },
      { value: "guide", label: "guide.md" },
    ],
  },
  {
    value: "src",
    label: "src",
    children: [
      { value: "engine", label: "engine.ts" },
      {
        value: "ui",
        label: "ui",
        children: [
          { value: "tree", label: "tree.tsx" },
          { value: "row", label: "row.tsx" },
        ],
      },
    ],
  },
];

export default function App() {
  const [checked, setChecked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>(["src"]);

  return (
    <CheckboxTree
      checked={checked}
      expanded={expanded}
      nodes={nodes}
      onCheck={setChecked}
      onExpand={setExpanded}
    />
  );
}`;

const OURS = `// npm i react-virtual-checkbox-tree
import { useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

// Same tree, flat instead of nested. Keys are IDs; "__root__" holds the top level.
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
  const [expanded, setExpanded] = useState<string[]>(["src"]);

  return (
    <Tree
      aria-label="Project files"
      checkedItems={checked}
      data={data}
      expandedItems={expanded}
      height={320}
      onCheck={setChecked}
      onExpand={setExpanded}
    />
  );
}`;

const FLATTEN = `// Nested -> flat, once, at the edge of your app.
import type { TreeDefinition, TreeItem } from "react-virtual-checkbox-tree";

type LegacyNode = { children?: LegacyNode[]; label: string; value: string };

export function flatten(nodes: LegacyNode[]): TreeDefinition {
  const data: TreeDefinition = {
    __root__: { id: "__root__", label: "root", children: nodes.map((n) => n.value) },
  };

  const walk = (node: LegacyNode) => {
    const item: TreeItem = { id: node.value, label: node.label };
    if (node.children?.length) {
      item.children = node.children.map((child) => child.value);
      node.children.forEach(walk);
    }
    data[node.value] = item;
  };

  nodes.forEach(walk);
  return data;
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
        lede="react-checkbox-tree renders a DOM node for every node in your tree. That is the whole difference, and for most trees it does not matter. It matters at about five thousand nodes, and it is fatal at fifty thousand — which is why issue #43 has been open since July 2017."
        title="react-virtual-checkbox-tree vs react-checkbox-tree"
      />

      <CompareBody>
        <p>
          These two libraries have the same mental model: a tree of nodes, leaf-only checked values,
          a parent that goes indeterminate when its children disagree, controlled{" "}
          <code>checked</code> and <code>expanded</code> arrays. If you already know
          react-checkbox-tree you already know this one, and the{" "}
          <Link href="/docs/migrating/react-checkbox-tree">migration guide</Link> is a prop-by-prop
          table rather than a rewrite.
        </p>
        <p>
          What differs is everything below the API: rows are virtualized, the cascade is stored
          sparsely instead of as an array of every checked value, there is a real{" "}
          <code>role=&quot;tree&quot;</code> with arrow-key navigation, and there is no stylesheet.
        </p>

        <FactTable
          facts={[
            {
              label: "react-checkbox-tree version",
              value: "2.0.2, published 2026-05-28",
              source: "https://www.npmjs.com/package/react-checkbox-tree",
              sourceLabel: "npm",
            },
            {
              label: "Weekly downloads",
              value: "61,054",
              source: "https://api.npmjs.org/downloads/point/last-week/react-checkbox-tree",
              sourceLabel: "npm registry",
            },
            {
              label: "GitHub stars",
              value: "731",
              source: "https://github.com/jakezatecky/react-checkbox-tree",
              sourceLabel: "repo",
            },
            {
              label: "Virtualization",
              value: "None. Issue #43 open since 2017-07-17",
              source: "https://github.com/jakezatecky/react-checkbox-tree/issues/43",
              sourceLabel: "#43",
            },
            {
              label: "Keyboard navigation",
              value: "Space / Enter only. #24 open since 2017-03-04",
              source: "https://github.com/jakezatecky/react-checkbox-tree/issues/24",
              sourceLabel: "#24",
            },
            {
              label: "Screen reader support",
              value: "#280 open since 2021-05-22",
              source: "https://github.com/jakezatecky/react-checkbox-tree/issues/280",
              sourceLabel: "#280",
            },
            {
              label: "Bundle",
              value: "11.0 kB gzipped + a required stylesheet",
              source: "https://bundlephobia.com/package/react-checkbox-tree@2.0.2",
              sourceLabel: "Bundlephobia",
            },
            { label: "Licence", value: "MIT, same as this library" },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="Verified facts"
        />

        <H2 id="what-it-does-better">What react-checkbox-tree does better</H2>

        <p>
          Quite a lot, and some of it is not on any roadmap here.
        </p>

        <Concede title="Ground this library does not hold">
          <ul>
            <li>
              <strong>Checkable folders.</strong> <code>checkModel=&quot;all&quot;</code> puts parent
              values into the <code>checked</code> array alongside leaves. This library cannot do
              that at all — <code>onCheck</code> returns leaf IDs and only leaf IDs, forever, because
              a folder&rsquo;s state here is derived rather than stored. If your server needs to
              hear &ldquo;the whole <code>src</code> folder&rdquo; rather than &ldquo;these five
              files&rdquo;, react-checkbox-tree expresses that today and this one does not.
            </li>
            <li>
              <strong>Independent parent and child state.</strong> <code>noCascade</code> gives you a
              tree where checking a parent does nothing to its children. There is no equivalent prop
              here; the cascade is the library.
            </li>
            <li>
              <strong>It works as a plain form field.</strong> The <code>name</code> and{" "}
              <code>nameAsArray</code> props render a hidden <code>&lt;input&gt;</code>, so a
              server-rendered form posts the selection with no JavaScript state at all.
            </li>
            <li>
              <strong>Right-to-left and localization.</strong> A <code>direction</code> prop and a{" "}
              <code>lang</code> object for every string it renders. This library renders no strings
              of its own, which sounds like an answer but means you build both yourself.
            </li>
            <li>
              <strong>Per-node disabling, icons and titles.</strong> <code>disabled</code>,{" "}
              <code>icon</code>, <code>showCheckbox</code> and <code>title</code> per node, plus{" "}
              <code>onContextMenu</code>. Here you would reach for <code>renderItem</code> and wire
              those yourself.
            </li>
            <li>
              <strong>Ten years and 61,000 downloads a week.</strong> It shipped in February 2016. It
              has been through React 16, 17, 18 and 19. Whatever edge case you are about to hit,
              somebody hit it first and there is probably an issue about it. This library has eight
              downloads a week and a 0.x version number.
            </li>
          </ul>
        </Concede>

        <H2 id="what-changes">What changes if you switch</H2>

        <h3>The data goes flat</h3>
        <p>
          The single real migration cost. react-checkbox-tree takes a nested array of{" "}
          <code>&#123; value, label, children &#125;</code>; this takes a flat map keyed by ID with a{" "}
          <code>__root__</code> entry. Lookups become O(1), IDs stay stable across updates, and you
          can build the map straight out of a SQL result — but you do have to convert.
        </p>

        <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={THEIRS} filename="before.tsx" />
          <CodeBlock code={OURS} filename="after.tsx" />
        </div>

        <p>If your data arrives nested from an API, convert it once:</p>

        <div className="not-prose my-6">
          <CodeBlock code={FLATTEN} filename="flatten.ts" />
        </div>

        <h3>The stylesheet goes away</h3>
        <p>
          There is no <code>react-virtual-checkbox-tree/lib/*.css</code> to import, because the
          library ships no stylesheet. The only styles it sets are the inline ones virtualization
          requires — the absolutely positioned row, its height, and the indent. Everything visual is
          yours. Rows carry <code>data-rvct-row</code>, <code>data-state</code> (
          <code>&quot;checked&quot;</code> / <code>&quot;unchecked&quot;</code> /{" "}
          <code>&quot;indeterminate&quot;</code>), <code>data-level</code>, <code>data-expanded</code>,{" "}
          <code>data-leaf</code> and <code>data-active</code>, and you style those. If you liked the
          Font Awesome look you will have to rebuild it; see{" "}
          <Link href="/docs/styling">Styling</Link>.
        </p>

        <h3><code>onCheck</code> changes shape</h3>
        <p>
          react-checkbox-tree calls <code>onCheck(checked, targetNode)</code>. This calls{" "}
          <code>onCheck(checkedLeafIds)</code> — one argument, always leaf IDs, never folders. If you
          were using <code>checkModel=&quot;all&quot;</code> there is no equivalent and you will need
          to derive the folder set yourself from the leaf IDs.
        </p>

        <h3>Keyboard and screen readers start working</h3>
        <p>
          react-checkbox-tree toggles on Space and Enter via its <code>checkKeys</code> prop, and
          that is the extent of it: there are no arrow keys, and{" "}
          <a
            href="https://github.com/jakezatecky/react-checkbox-tree/issues/280"
            rel="noreferrer noopener"
            target="_blank"
          >
            issue #280
          </a>{" "}
          (&ldquo;Checkbox tree is not accessible through keyboard&rdquo;) has been open since 2021.
          This library implements the WAI-ARIA tree pattern: <code>role=&quot;tree&quot;</code> with{" "}
          <code>aria-multiselectable</code>, <code>role=&quot;treeitem&quot;</code> with{" "}
          <code>aria-level</code>, <code>aria-setsize</code>, <code>aria-posinset</code> and{" "}
          <code>aria-checked=&quot;mixed&quot;</code>, plus ArrowUp/Down/Left/Right, Home, End,
          Space, Enter, <code>*</code> to expand everything, Ctrl/Cmd+A, and type-ahead. Focus is
          tracked with <code>aria-activedescendant</code> on the container, so a row being unmounted
          by the virtualizer can never take the focus with it.
        </p>

        <H2 id="performance">How much does the virtualization actually buy?</H2>
        <p>
          Below roughly 2,000 nodes: nothing you will notice. react-checkbox-tree flattens its source
          tree into a map internally and memoizes, and it is not a slow library — it is an
          unvirtualized one, which is a different problem. The cost is DOM: every node is an element,
          every check re-renders the subtree, and every value lands in a{" "}
          <code>checked</code> array that grows with the selection.
        </p>
        <p>
          Here the DOM holds a window of rows regardless of tree size, and the selection is stored as
          sparse assignments rather than a list — checking a folder of 50,000 leaves writes one map
          entry. These are measured, on the published build, with{" "}
          <code>npm run bench</code>:
        </p>

        <div className="not-prose my-6 overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left">
                <th className="px-4 py-2.5 font-medium">Nodes</th>
                <th className="px-4 py-2.5 font-medium">Cascade a check</th>
                <th className="px-4 py-2.5 font-medium">Read the selection</th>
                <th className="px-4 py-2.5 font-medium">Rows in the DOM</th>
              </tr>
            </thead>
            <tbody className="tnum font-mono">
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-4 py-2.5">1,110</td>
                <td className="px-4 py-2.5 text-[var(--color-ok)]">3 µs</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">53 µs</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">~20</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]">
                <td className="px-4 py-2.5">11,110</td>
                <td className="px-4 py-2.5 text-[var(--color-ok)]">1 µs</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">320 µs</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">~20</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">111,110</td>
                <td className="px-4 py-2.5 text-[var(--color-ok)]">1 µs</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">3.7 ms</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">~20</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          The honest column is the middle one. Asking for the full list of checked leaf IDs has to
          materialize that list, and at 111,110 nodes that is 3.7 ms per change. At that scale you
          read <code>getCheckedSubtrees()</code> instead — the sparse form — which is what{" "}
          <Link href="/docs/recipes/persist-selection">Persist a selection</Link> is about. Building
          the engine is also linear: 115 ms at 111,110 nodes, about two seconds at a million.
        </p>

        <H2 id="stay">Should you migrate?</H2>
        <p>
          Probably not, if it currently works. A working react-checkbox-tree with 400 nodes in it is
          not a problem you have. Migrate when the tree got big enough that opening the panel janks,
          when an accessibility audit came back, or when you need search that filters rather than
          highlights.
        </p>

        <Verdict
          otherLabel="react-checkbox-tree"
          otherWhen="Your tree is a few thousand nodes or fewer, you want checkable folders or noCascade, you need RTL and localized strings out of the box, or you value ten years of production mileage over any of the above. It is a good library and the number of apps quietly relying on it is the strongest argument in its favour."
          ourWhen="The tree is large enough that rendering every node hurts, you need arrow-key navigation and a correct ARIA tree, you want search that filters and a selection that survives it, or you would rather own the markup than override a stylesheet."
        >
          <p className="mt-3 text-[13.5px] text-[var(--color-muted)]">
            <Link
              className="text-[var(--color-accent)] underline underline-offset-3"
              href="/docs/migrating/react-checkbox-tree"
            >
              The prop-by-prop migration map →
            </Link>
          </p>
        </Verdict>

        <CompareFooter slug="react-checkbox-tree" />
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
        headline: "react-virtual-checkbox-tree vs react-checkbox-tree",
        description:
          "A sourced comparison of react-checkbox-tree and react-virtual-checkbox-tree: virtualization, tri-state semantics, keyboard support, and the migration cost.",
        url: `${site.url}/compare/react-checkbox-tree`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is react-checkbox-tree virtualized?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Every node in the tree renders a DOM element. Issue #43, 'Poor performance when data is huge', has been open on the repository since 17 July 2017 and virtualization did not ship in the 2.x line.",
            },
          },
          {
            "@type": "Question",
            name: "Can react-checkbox-tree return folder values as well as leaves?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Setting checkModel=\"all\" stores parent values in the checked array alongside leaf values. react-virtual-checkbox-tree has no equivalent: onCheck returns leaf IDs only, because folder state is derived rather than stored.",
            },
          },
          {
            "@type": "Question",
            name: "How do I convert react-checkbox-tree nodes to a TreeDefinition?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Walk the nested nodes array once and write each node into a flat map keyed by its value, replacing the children array of objects with an array of child IDs, then add a __root__ entry whose children are the top-level values.",
            },
          },
          {
            "@type": "Question",
            name: "Does react-checkbox-tree support arrow-key navigation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Its checkKeys prop toggles a focused node with Space or Enter. Issue #24, 'Allow greater keyboard control', has been open since March 2017 and issue #280, 'Checkbox tree is not accessible through keyboard', since May 2021.",
            },
          },
        ],
      },
    ],
  };
}
