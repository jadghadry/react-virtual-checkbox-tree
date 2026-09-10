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
  title: "vs rc-tree and antd Tree — react-virtual-checkbox-tree",
  description:
    "antd Tree really is virtualized and really does tri-state — if you pass height. What you get, and what the Ant Design markup costs you.",
  alternates: { canonical: "/compare/rc-tree" },
};

const ANTD = `// antd Tree: checkable + virtualized — but only if you pass height.
// npm i antd
import { Tree } from "antd";
import { useState, type Key } from "react";

const treeData = [
  { key: "docs", title: "docs", children: [{ key: "readme", title: "README.md" }, { key: "guide", title: "guide.md" }] },
  {
    key: "src",
    title: "src",
    children: [
      { key: "engine", title: "engine.ts" },
      { key: "ui", title: "ui", children: [{ key: "tree", title: "tree.tsx" }, { key: "row", title: "row.tsx" }] },
    ],
  },
];

export default function App() {
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);

  return (
    <Tree
      checkable
      checkedKeys={checkedKeys}
      // Without height, NodeList returns the full list and nothing is virtualized.
      height={320}
      onCheck={(keys) => setCheckedKeys(keys as Key[])}
      treeData={treeData}
    />
  );
}`;

const OURS = `// react-virtual-checkbox-tree: virtualized whether or not you remember a prop.
// npm i react-virtual-checkbox-tree
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

const SEARCH = `// Search here removes rows rather than marking them, and checking a folder
// while filtered touches only the leaves you can currently see.
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
  const [query, setQuery] = useState("");

  return (
    <>
      <input onChange={(event) => setQuery(event.target.value)} placeholder="Filter files" value={query} />
      <Tree
        aria-label="Project files"
        data={data}
        height={320}
        minSearchChars={3}
        onCheck={(checkedLeafIds) => console.log(checkedLeafIds)}
        searchQuery={query}
        searchScope="all"
      />
    </>
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
        lede="This is the one that genuinely does both. rc-tree virtualizes and does tri-state, plus async loading and drag-and-drop that this library does not have at all. What you pay for it is the markup: Ant Design's class names, Ant Design's DOM, and a virtualizer that silently does nothing if you forget the height prop."
        title="react-virtual-checkbox-tree vs rc-tree / antd Tree"
      />

      <CompareBody>
        <p>
          Of everything on this site, rc-tree is the strongest competitor on features. It is
          checkable with a real indeterminate state, it has <code>checkStrictly</code> for when you
          want parents and children decoupled, it loads children asynchronously through{" "}
          <code>loadData</code>, it is draggable, and it has been shipping since 2015. If the
          feature list is the whole decision, it wins.
        </p>
        <p>
          The decision usually is not the feature list. It is whether you want your tree to be
          Ant-shaped.
        </p>

        <FactTable
          facts={[
            {
              label: "Package, current",
              value: "@rc-component/tree 1.5.3, published 2026-09-10",
              source: "https://www.npmjs.com/package/@rc-component/tree",
              sourceLabel: "npm",
            },
            {
              label: "Package, legacy",
              value: "rc-tree 5.13.1, last published 2025-02-25",
              source: "https://www.npmjs.com/package/rc-tree",
              sourceLabel: "npm",
            },
            {
              label: "Weekly downloads",
              value: "2,223,750 rc-tree + 693,729 @rc-component/tree",
              source: "https://api.npmjs.org/downloads/point/last-week/rc-tree",
              sourceLabel: "npm registry",
            },
            {
              label: "GitHub stars",
              value: "1,272 react-component/tree · 99,453 ant-design",
              source: "https://github.com/react-component/tree",
              sourceLabel: "repo",
            },
            {
              label: "Virtualization",
              value: "Yes, but only when `height` is set",
              source: "https://github.com/react-component/tree/blob/master/src/NodeList.tsx",
              sourceLabel: "NodeList.tsx",
            },
            {
              label: "Tri-state",
              value: "Yes — `checkable`, with `checkStrictly` to decouple",
              source: "https://ant.design/components/tree",
              sourceLabel: "antd docs",
            },
            {
              label: "Bundle",
              value: "27.4 kB rc-tree / 22.5 kB @rc-component/tree gzipped",
              source: "https://bundlephobia.com/package/rc-tree@5.13.1",
              sourceLabel: "Bundlephobia",
            },
            { label: "Licence", value: "MIT, same as this library" },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="Verified facts"
        />

        <H2 id="what-it-does-better">What rc-tree and antd Tree do better</H2>

        <p>Three things this library cannot do at all, and one it does worse.</p>

        <Concede title="Ground this library does not hold">
          <ul>
            <li>
              <strong>Async children.</strong> <code>loadData</code> returns a promise and children
              arrive when a folder opens, with retry handling built in. There is no{" "}
              <code>onLoadChildren</code> here — you rebuild <code>data</code> as pages land and
              nothing is lost, but that is a different shape of solution.
            </li>
            <li>
              <strong>Drag and drop.</strong> <code>draggable</code>, <code>onDrop</code>,{" "}
              <code>allowDrop</code>. Absent here, permanently.
            </li>
            <li>
              <strong>checkStrictly.</strong> Parents and children fully decoupled, and{" "}
              <code>checkedKeys</code> that include folder keys. This library cannot express a
              checked folder at all — <code>onCheck</code> returns leaf IDs only.
            </li>
            <li>
              <strong>Everything around the tree.</strong> Directory tree mode,{" "}
              <code>showLine</code>, <code>onRightClick</code>, <code>titleRender</code>,{" "}
              <code>fieldNames</code> to map your own field names, and — if you use antd — a whole
              product&rsquo;s worth of matching components.
            </li>
            <li>
              <strong>Eleven years and 2.9 million downloads a week across the two packages.</strong>{" "}
              rc-tree first published in May 2015. This library has eight downloads a week and a 0.x
              version number, and pretending otherwise would be silly.
            </li>
          </ul>
        </Concede>

        <H2 id="height">The height prop is a trap worth knowing about</H2>
        <p>
          <code>virtual</code> defaults to <code>true</code>, which reads like virtualization is on
          by default. It is not, quite. The list component checks both:
        </p>
        <div className="not-prose my-6">
          <CodeBlock
            code={`// react-component/tree, src/NodeList.tsx
if (virtual === false || !height) {
  return list;
}
return list.slice(0, Math.ceil(height / itemHeight) + 1);`}
            filename="NodeList.tsx"
            lang="ts"
          />
        </div>
        <p>
          No <code>height</code>, no virtualization — every node renders and nothing warns you.
          It is a reasonable design (the component cannot virtualize a container it cannot measure),
          and it is also the single most common reason someone reports that &ldquo;antd Tree is slow
          with 50,000 nodes&rdquo;. The antd docs also note that enabling it costs you horizontal
          scrolling.
        </p>
        <p>
          Here the virtualizer is not conditional. <code>height</code> defaults to{" "}
          <code>&quot;100%&quot;</code>, <code>estimateSize</code> defaults to <code>32</code> and
          accepts <code>(index) =&gt; number</code>, <code>overscan</code> defaults to{" "}
          <code>8</code>, and rows scroll horizontally because each row is{" "}
          <code>width: max-content</code> with a <code>min-width</code> of 100%.
        </p>

        <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={ANTD} filename="antd.tsx" />
          <CodeBlock code={OURS} filename="rvct.tsx" />
        </div>

        <H2 id="markup">What the Ant markup costs</H2>
        <p>
          rc-tree is the unstyled engine under antd&rsquo;s Tree, so &ldquo;use rc-tree
          directly&rdquo; sounds like the headless option. It is not: the DOM structure and the class
          name scheme are the library&rsquo;s, the switcher and checkbox are its elements, and you
          style around them with a <code>prefixCls</code>. That is themeable, not headless.
        </p>
        <p>
          This library emits a flat row per visible node and nothing else. The styling contract is
          data attributes: <code>data-rvct-tree</code> on the container, and{" "}
          <code>data-rvct-row</code>, <code>data-state</code>, <code>data-level</code>,{" "}
          <code>data-expanded</code>, <code>data-leaf</code> and <code>data-active</code> on rows.
          Three render props — <code>renderItem</code>, <code>renderCheckbox</code>,{" "}
          <code>renderExpander</code> — replace the row body, the checkbox and the expander outright.
          See <Link href="/docs/styling">Styling</Link>.
        </p>

        <H2 id="search">Search filters here; filterTreeNode marks</H2>
        <p>
          rc-tree&rsquo;s <code>filterTreeNode</code> returns a boolean per node and tags matching
          nodes so you can highlight them. The non-matching nodes stay in the list. Searching
          here is a filter: <code>searchQuery</code> removes rows that do not match and do not
          contain a match, auto-expands the branches that do, and restores your original expansion
          when you clear the box.
        </p>
        <p>
          It also changes what checking means, which is the part worth reading twice. With a query
          active, checking a folder toggles <em>only the leaves currently visible</em>. Filter to
          twelve matches, check the folder, clear the filter — exactly those twelve are checked, and
          the other eight hundred files in that folder are untouched. A folder&rsquo;s indeterminate
          state also summarizes only its visible children while filtered.
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={SEARCH} filename="search.tsx" />
        </div>

        <p>
          <code>searchScope</code> defaults to <code>&quot;all&quot;</code>, so folder names match
          too and a matching folder carries its whole subtree into the filtered view. Pass{" "}
          <code>&quot;leaves&quot;</code> for leaf-only matching. Matching is diacritic-insensitive:{" "}
          <code>resume</code> finds <code>Résumé</code>.
        </p>

        <H2 id="scale">Selection storage at scale</H2>
        <p>
          <code>checkedKeys</code> is an array of every checked key. That is a fine contract and it
          is what most trees expose, including this one by default. The difference is that here it is
          not the storage: selection is a sparse map of explicit assignments, so checking a folder of
          50,000 leaves writes one entry, and{" "}
          <span className="tnum font-mono">1–3 µs</span> is the cascade cost at 1,110 nodes and at
          1,111,110 nodes alike. When materializing the full list becomes the bottleneck — 3.7 ms at
          111,110 nodes — you read <code>getCheckedSubtrees()</code> instead and keep the sparse form.{" "}
          <Link href="/docs/recipes/persist-selection">Persist a selection</Link> covers it.
        </p>

        <Verdict
          otherLabel="rc-tree / antd Tree"
          otherWhen="You are already on Ant Design, or you need async children, drag-and-drop or checkStrictly. It does all three and this library does none of them, and 2.9 million weekly downloads across its two packages means the bugs have been found. Just remember to pass height."
          ourWhen="You want the markup to be yours rather than Ant's, you want virtualization that cannot be accidentally switched off, you need search that filters and a selection that survives filtering, or your tree is large enough that the checked-keys array is itself the cost."
        />

        <CompareFooter slug="rc-tree" />
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
        headline: "react-virtual-checkbox-tree vs rc-tree and antd Tree",
        description:
          "A sourced comparison: rc-tree virtualizes only when height is set, ships tri-state, async loading and drag-and-drop, and hands you Ant Design's markup.",
        url: `${site.url}/compare/rc-tree`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is antd Tree virtualized?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Only when you pass a height prop. The virtual prop defaults to true, but NodeList.tsx short-circuits with 'if (virtual === false || !height) return list', so without a height every node renders and nothing warns you. Enabling it also disables horizontal scrolling.",
            },
          },
          {
            "@type": "Question",
            name: "Does rc-tree support tri-state checkboxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The checkable prop adds checkboxes with cascading parent and child state and an indeterminate state on partially checked parents, and checkStrictly turns the cascade off so parents and children are independent.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between rc-tree and @rc-component/tree?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "They are the same project under two package names. rc-tree 5.13.1 was last published in February 2025 and still has 2.2 million weekly downloads; @rc-component/tree 1.5.3 is the current line, published in September 2026, and is what Ant Design 6 imports.",
            },
          },
        ],
      },
    ],
  };
}
