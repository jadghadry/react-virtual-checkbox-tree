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
  title: "vs headless-tree — react-virtual-checkbox-tree",
  description:
    "Headless Tree does more, and its own docs say virtualization is not an included feature. Where the two overlap, and which one to reach for.",
  alternates: { canonical: "/compare/headless-tree" },
};

const HT = `// headless-tree: features are opt-in modules, virtualization is not one of them.
import { useTree } from "@headless-tree/react";
import {
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";

const items: Record<string, { children?: string[]; name: string }> = {
  root:   { name: "root", children: ["docs", "src"] },
  docs:   { name: "docs", children: ["readme", "guide"] },
  readme: { name: "README.md" },
  guide:  { name: "guide.md" },
  src:    { name: "src", children: ["engine", "ui"] },
  engine: { name: "engine.ts" },
  ui:     { name: "ui", children: ["tree", "row"] },
  tree:   { name: "tree.tsx" },
  row:    { name: "row.tsx" },
};

export default function App() {
  const tree = useTree<{ name: string }>({
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => Boolean(items[item.getId()].children),
    propagateCheckedState: true,
    dataLoader: {
      getItem: (id) => items[id],
      getChildren: (id) => items[id].children ?? [],
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, checkboxesFeature],
  });

  // Every item renders. Wiring a virtualizer around tree.getItems() is your job.
  return (
    <div {...tree.getContainerProps()}>
      {tree.getItems().map((item) => (
        <button {...item.getProps()} key={item.getId()}>
          <input type="checkbox" {...item.getCheckboxProps()} />
          {item.getItemName()}
        </button>
      ))}
    </div>
  );
}`;

const OURS = `// react-virtual-checkbox-tree: virtualization is not optional and not yours to wire.
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
  return (
    <Tree
      aria-label="Project files"
      data={data}
      estimateSize={32}
      height={320}
      overscan={8}
      onCheck={(checkedLeafIds) => console.log(checkedLeafIds)}
    />
  );
}`;

const ENGINE = `// The overlap: our headless core, with no React and no virtualizer in it.
// Runs in Node, in a test, or in a Server Component — there is no "use client" here.
import { CheckedState, Engine } from "react-virtual-checkbox-tree/engine";
import type { TreeDefinition, VisibleItem } from "react-virtual-checkbox-tree/engine";

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

function render(rows: VisibleItem[]) {
  for (const row of rows) {
    console.log("  ".repeat(row.level) + engine.getLabel(row.id), engine.getViewState(row.id));
  }
}

const engine = new Engine(data);

// subscribe() returns its own unsubscribe function.
const unsubscribe = engine.subscribe(() => render(engine.getVisibleItems()));

engine.expandAll();
engine.toggle("ui", true);

engine.getViewState("src") === CheckedState.Indeterminate; // true
engine.getViewState("ui") === CheckedState.Checked;        // true
engine.getAllChecked();   // ["tree", "row"] — leaves only, never folders
engine.getVisibleItems(); // flat rows: { id, isExpanded, isFolder, level, posInSet, setSize }

unsubscribe();`;

export default function Page() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        type="application/ld+json"
      />

      <CompareHeader
        eyebrow="Compare"
        lede="Headless Tree is the closest thing to a philosophical sibling this library has, and it does more: drag-and-drop, async loading, renaming, search, keyboard drag-and-drop, all as opt-in feature modules. Its docs are also explicit that virtualization is not one of them."
        title="react-virtual-checkbox-tree vs headless-tree"
      />

      <CompareBody>
        <p>
          Both are headless. Both do tri-state. Both keep the tree logic in a framework-free core.
          The difference is one sentence, and it is theirs, from{" "}
          <a href="https://headless-tree.lukasbach.com/recipe/virtualization/" rel="noreferrer noopener" target="_blank">
            their virtualization recipe
          </a>
          : &ldquo;Virtualization is not a included feature of Headless Tree, but you can easily pass
          this flat list to any virtualization library of your choice.&rdquo;
        </p>
        <p>
          That is a fair description of a real, working recipe — they flatten the tree for you and
          the integration is genuinely short. It is also the difference between a feature and an
          exercise, and this library exists on the other side of that line: the virtualizer is a
          dependency, the row heights are a prop, and the keyboard model was designed around rows
          that unmount.
        </p>

        <FactTable
          facts={[
            {
              label: "Version",
              value: "@headless-tree/core 1.7.0, published 2026-05-17",
              source: "https://www.npmjs.com/package/@headless-tree/core",
              sourceLabel: "npm",
            },
            {
              label: "Weekly downloads",
              value: "296,920 core / 275,559 react",
              source: "https://api.npmjs.org/downloads/point/last-week/@headless-tree/core",
              sourceLabel: "npm registry",
            },
            {
              label: "GitHub stars",
              value: "897",
              source: "https://github.com/lukasbach/headless-tree",
              sourceLabel: "repo",
            },
            {
              label: "Virtualization",
              value: "Not included — a documented recipe",
              source: "https://headless-tree.lukasbach.com/recipe/virtualization/",
              sourceLabel: "their docs",
            },
            {
              label: "Tri-state checkboxes",
              value: "Yes — checkboxesFeature + propagateCheckedState",
              source: "https://headless-tree.lukasbach.com/features/checkboxes/",
              sourceLabel: "their docs",
            },
            {
              label: "Bundle",
              value: "12.3 kB + 1.2 kB gzipped, zero dependencies",
              source: "https://bundlephobia.com/package/@headless-tree/core@1.7.0",
              sourceLabel: "Bundlephobia",
            },
            { label: "Licence", value: "MIT, same as this library" },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="Verified facts"
        />

        <H2 id="what-it-does-better">What headless-tree does better</H2>

        <p>
          More than this library does, by a wide margin, and the gap is not close in most columns.
        </p>

        <Concede title="Ground this library does not hold">
          <ul>
            <li>
              <strong>Drag and drop, including from the keyboard.</strong>{" "}
              <code>dragAndDropFeature</code> plus a dedicated keyboard drag-and-drop feature.
              There is nothing comparable here and there is not going to be.
            </li>
            <li>
              <strong>Async children.</strong> <code>asyncDataLoaderFeature</code> loads children when
              a folder opens. This library has no <code>onLoadChildren</code> — you rebuild{" "}
              <code>data</code> and state survives, which is a workaround with a{" "}
              <Link href="/docs/recipes/async-children">recipe page</Link>, not a feature.
            </li>
            <li>
              <strong>Renaming.</strong> <code>renamingFeature</code> gives you inline edit state.
              Not present here.
            </li>
            <li>
              <strong>Zero runtime dependencies.</strong> The core has none. This library has one,{" "}
              <code>@tanstack/react-virtual</code>, precisely because virtualization is not optional
              here.
            </li>
            <li>
              <strong>A composable feature architecture.</strong> You import only the behaviours you
              use and the item instance grows methods to match. This library is one component and one
              class, take it or leave it.
            </li>
            <li>
              <strong>Thirty times the install base and 141 published versions.</strong> 1.x, stable,
              widely used. This is v{site.version} with a 0.x API that will still move.
            </li>
          </ul>
        </Concede>

        <H2 id="virtualization">If virtualization is just a recipe, why does it matter?</H2>
        <p>
          Because the recipe changes what the rest of the tree can assume, and those assumptions are
          load-bearing.
        </p>
        <ul>
          <li>
            <strong>Focus.</strong> Once rows unmount, a row that owns DOM focus takes the focus with
            it when it scrolls out of view. This library never puts focus on a row: the container is
            the focusable element and the active row is tracked with{" "}
            <code>aria-activedescendant</code>, which is exactly why virtualization cannot break it.
            Bolting a virtualizer onto a tree whose rows are focusable elements is where this goes
            wrong, and it is a class of bug that does not announce itself in a demo.
          </li>
          <li>
            <strong>Row measurement.</strong> <code>estimateSize</code> here takes a number or{" "}
            <code>(index) =&gt; number</code>, and <code>overscan</code> and <code>indent</code> are
            props. In a recipe those are yours to plumb through.
          </li>
          <li>
            <strong>Flattening cost.</strong> The flat row list is cached against a structure version
            that a selection change deliberately does not bump — check a box in a 111,110-node tree
            and the row list is not rebuilt. Measured, that flatten is 25 ms at 111,110 nodes, so
            doing it per keystroke is the difference between a smooth tree and a janky one.
          </li>
          <li>
            <strong>It does not combine with their nested rendering.</strong>{" "}
            <a href="https://github.com/lukasbach/headless-tree/issues/185" rel="noreferrer noopener" target="_blank">
              Issue #185
            </a>{" "}
            is open on exactly this: the virtualization recipe uses the flat{" "}
            <code>tree.getItems()</code> list, and the nested-rendering recipe does not.
          </li>
        </ul>

        <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={HT} filename="headless-tree.tsx" />
          <CodeBlock code={OURS} filename="rvct.tsx" />
        </div>

        <H2 id="search">The search semantics are different, not just present</H2>
        <p>
          Both have search. They do different things. Headless Tree&rsquo;s{" "}
          <code>searchFeature</code> is a find-and-highlight over the visible items. Search here is a
          filter that changes which rows exist, and it changes what checking a folder means: with a
          query active, checking a parent affects <em>only the leaves currently visible</em>. Filter
          to twelve matches, check the folder, clear the filter, and exactly those twelve are
          checked. A folder&rsquo;s tri-state also summarizes only its visible children while
          filtered, because that is what the user is looking at. Clearing the query restores the
          expansion the user had before they started typing. Details in{" "}
          <Link href="/docs/search">Search</Link>.
        </p>

        <H2 id="engine">Where the two libraries actually overlap</H2>
        <p>
          On the core. If you want the tri-state math and the flattening without a renderer,{" "}
          <code>react-virtual-checkbox-tree/engine</code> is a plain class with{" "}
          <code>subscribe()</code>, no React import and no virtualizer in the bundle — the same shape
          of thing <code>@headless-tree/core</code> is, with a much smaller surface.
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={ENGINE} filename="engine.ts" lang="ts" />
        </div>

        <p>
          One asymmetry worth stating: Headless Tree&rsquo;s core is framework-agnostic with React
          bindings shipped and others planned. This library&rsquo;s engine is framework-agnostic in
          the same sense — it is just a class — but the only renderer that exists is the React one.
        </p>

        <Verdict
          otherLabel="headless-tree"
          otherWhen="You need drag-and-drop, async children, renaming, or a feature set you compose yourself — and your tree is small enough that rendering every item is fine, or you are happy to wire a virtualizer and own the focus and measurement details that come with it. It is more capable than this library in almost every direction except that one."
          ourWhen="Your tree is large enough that virtualization is not optional, and you want it already integrated with the tri-state math, the ARIA tree and a focus model designed for rows that unmount. You are trading away drag-and-drop, async loading and renaming to get it."
        />

        <CompareFooter slug="headless-tree" />
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
        headline: "react-virtual-checkbox-tree vs headless-tree",
        description:
          "A sourced comparison of Headless Tree and react-virtual-checkbox-tree: feature breadth versus built-in virtualization, and how the two search models differ.",
        url: `${site.url}/compare/headless-tree`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does headless-tree support virtualization?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not as a built-in feature. Its own documentation states: 'Virtualization is not a included feature of Headless Tree, but you can easily pass this flat list to any virtualization library of your choice.' The docs include a working recipe that pairs tree.getItems() with TanStack Virtual.",
            },
          },
          {
            "@type": "Question",
            name: "Does headless-tree have tri-state checkboxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The checkboxesFeature with propagateCheckedState renders a folder as checked when all children are checked, indeterminate when only some are, and unchecked when none are.",
            },
          },
          {
            "@type": "Question",
            name: "Why does built-in virtualization matter if a recipe exists?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Because unmounting rows changes what the rest of the component can assume. react-virtual-checkbox-tree keeps DOM focus on the container and tracks the active row with aria-activedescendant so a scrolled-away row cannot destroy the focus, exposes estimateSize and overscan as props, and caches the flattened row list against a structure version that selection changes deliberately do not bump.",
            },
          },
        ],
      },
    ],
  };
}
