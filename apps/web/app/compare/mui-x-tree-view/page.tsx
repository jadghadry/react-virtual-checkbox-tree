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
  title: "vs MUI X Rich Tree View — react-virtual-checkbox-tree",
  description:
    "MUI X gives you tri-state checkboxes free and virtualization for $299 per developer per year. What that trade actually costs, and what MUI does better.",
  alternates: { canonical: "/compare/mui-x-tree-view" },
};

const MUI = `// MUI X: tri-state is free. Virtualization is RichTreeViewPro.
// npm i @mui/x-tree-view @mui/material @emotion/react @emotion/styled
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useState } from "react";

const items = [
  { id: "docs", label: "docs", children: [{ id: "readme", label: "README.md" }, { id: "guide", label: "guide.md" }] },
  {
    id: "src",
    label: "src",
    children: [
      { id: "engine", label: "engine.ts" },
      { id: "ui", label: "ui", children: [{ id: "tree", label: "tree.tsx" }, { id: "row", label: "row.tsx" }] },
    ],
  },
];

export default function App() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <RichTreeView
      checkboxSelection
      items={items}
      multiSelect
      onSelectedItemsChange={(_event, ids) => setSelected(ids as string[])}
      selectedItems={selected}
      selectionPropagation={{ descendants: true, parents: true }}
    />
  );
}`;

const OURS = `// react-virtual-checkbox-tree: virtualized by default, no design system attached.
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

const MUI_CHECKBOX = `// Keep the MUI look, drop the MUI tree: render their Checkbox in renderCheckbox.
import Checkbox from "@mui/material/Checkbox";
import { CheckedState, Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

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
      estimateSize={36}
      height={320}
      renderCheckbox={({ a11yProps, checkedState }) => (
        // a11yProps is { "aria-hidden": true, tabIndex: -1 } and MUST be spread:
        // the ROW carries role="treeitem" and aria-checked, so the visual control
        // has to stay out of the tab order and out of the accessibility tree.
        <Checkbox
          {...a11yProps}
          checked={checkedState === CheckedState.Checked}
          disableRipple
          indeterminate={checkedState === CheckedState.Indeterminate}
          onChange={() => {
            /* the row owns the interaction; this keeps React from warning */
          }}
          size="small"
        />
      )}
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
        lede="MUI X gives you tri-state checkbox selection for free, in the MIT community package, and it is genuinely good. What it puts behind the Pro licence is virtualization — $299 per developer per year, which for a team of six is $1,794 a year to stop rendering rows you cannot see."
        title="react-virtual-checkbox-tree vs MUI X Rich Tree View"
      />

      <CompareBody>
        <p>
          People assume the split runs the other way, so it is worth saying plainly:{" "}
          <strong>
            checkbox selection and parent/child propagation are in the free package
          </strong>
          . <code>checkboxSelection</code> plus{" "}
          <code>selectionPropagation=&#123;&#123; descendants: true, parents: true &#125;&#125;</code>{" "}
          gets you cascading selection with an automatic indeterminate state, at no cost, from a
          library with a full-time team behind it. If your tree is a few hundred items and you are
          already on Material UI, that is the correct answer and this page is not trying to change
          your mind.
        </p>
        <p>
          The split is virtualization. That lives in <code>RichTreeViewPro</code>, from{" "}
          <code>@mui/x-tree-view-pro</code>, which needs an MUI X Pro licence.
        </p>

        <FactTable
          facts={[
            {
              label: "Community version",
              value: "@mui/x-tree-view 9.13.0, published 2026-09-04",
              source: "https://www.npmjs.com/package/@mui/x-tree-view",
              sourceLabel: "npm",
            },
            {
              label: "Weekly downloads",
              value: "1,043,769",
              source: "https://api.npmjs.org/downloads/point/last-week/@mui/x-tree-view",
              sourceLabel: "npm registry",
            },
            {
              label: "Tri-state, community tier",
              value: "Yes — checkboxSelection + selectionPropagation",
              source: "https://mui.com/x/react-tree-view/rich-tree-view/selection/",
              sourceLabel: "MUI docs",
            },
            {
              label: "Virtualization",
              value: "RichTreeViewPro only, on by default in v9",
              source: "https://mui.com/x/react-tree-view/rich-tree-view/virtualization/",
              sourceLabel: "MUI docs",
            },
            {
              label: "Pro licence",
              value: "$299 per developer per year",
              source: "https://mui.com/pricing/",
              sourceLabel: "MUI pricing",
            },
            {
              label: "Bundle",
              value: "21.2 kB gzipped community / 40.8 kB Pro, before @mui/material",
              source: "https://bundlephobia.com/package/@mui/x-tree-view@9.13.0",
              sourceLabel: "Bundlephobia",
            },
            {
              label: "Virtualization request",
              value: "Issue #9685, closed 2026-01-23",
              source: "https://github.com/mui/mui-x/issues/9685",
              sourceLabel: "#9685",
            },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="Verified facts"
        />

        <H2 id="what-it-does-better">What MUI X does better</H2>

        <p>
          It is a commercial product with a team, a release train and a support contract. That shows.
        </p>

        <Concede title="Ground this library does not hold">
          <ul>
            <li>
              <strong>Checkable folders that survive the round trip.</strong> With{" "}
              <code>selectionPropagation.parents</code>, selecting every child selects the parent, and
              the parent&rsquo;s ID comes back in <code>selectedItems</code>. This library&rsquo;s{" "}
              <code>onCheck</code> returns leaf IDs and nothing else, by design. If your API wants
              &ldquo;the whole folder&rdquo; as a value, MUI expresses it and this does not.
            </li>
            <li>
              <strong>Label editing.</strong> The Rich Tree View has built-in item label editing.
              There is no equivalent here.
            </li>
            <li>
              <strong>Pro: lazy loading and item reordering.</strong> Async children on expand and
              drag-to-reorder, both supported, both documented, both absent here at any price.
            </li>
            <li>
              <strong>A design system that already matches your app.</strong> If the rest of the
              product is Material, the tree looks right on day one. Here you write every pixel — which
              is the selling point and also the work.
            </li>
            <li>
              <strong>Documentation, i18n, and a support channel.</strong> Localization, an
              accessibility story maintained by people whose job it is, and Pro support if something
              breaks in production.
            </li>
            <li>
              <strong>A million downloads a week against eight.</strong> Whatever you are about to
              hit, someone hit it, filed it, and it has a milestone.
            </li>
          </ul>
        </Concede>

        <H2 id="the-trade">What the $299 actually buys, and what it doesn&rsquo;t</H2>
        <p>
          The Pro tier is not a rip-off — you are also getting lazy loading and reordering, and MUI X
          Pro covers the Data Grid too. The question is narrower: if virtualization is the{" "}
          <em>only</em> Pro feature you need, you are paying a per-seat annual fee for a rendering
          strategy. This library does that part for free and under MIT, at 5.6 kB gzipped (12.6 kB
          with its one dependency) against 40.8 kB for <code>@mui/x-tree-view-pro</code> before{" "}
          <code>@mui/material</code> and Emotion are counted.
        </p>
        <p>
          You give up the design system, the editing, the reordering and the support contract to get
          it. That is the trade in one sentence.
        </p>

        <div className="not-prose my-6 grid gap-4 lg:grid-cols-2">
          <CodeBlock code={MUI} filename="mui.tsx" />
          <CodeBlock code={OURS} filename="rvct.tsx" />
        </div>

        <H2 id="keep-material">Can I keep the Material look?</H2>
        <p>
          Yes — that is what <code>renderCheckbox</code> is for. Render{" "}
          <code>@mui/material</code>&rsquo;s own <code>Checkbox</code> inside this tree and you get
          Material pixels with virtualized rows. The one rule you must not break is spreading{" "}
          <code>a11yProps</code> onto the control.
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={MUI_CHECKBOX} filename="material-skin.tsx" />
        </div>

        <p>
          <code>a11yProps</code> is <code>&#123; &quot;aria-hidden&quot;: true, tabIndex: -1 &#125;</code>
          . The row carries <code>role=&quot;treeitem&quot;</code> and{" "}
          <code>aria-checked</code>, so a visible, focusable checkbox inside it makes every row
          announce twice and puts hundreds of controls in the tab order. Spread it. Same rule for{" "}
          <code>renderExpander</code>. Full details in{" "}
          <Link href="/docs/rendering">Render props</Link>.
        </p>
        <p>
          One typing detail: <code>checkedState</code> is the <code>CheckedState</code> string enum,
          not a bare string. Compare against <code>CheckedState.Checked</code> and{" "}
          <code>CheckedState.Indeterminate</code> — TypeScript rejects{" "}
          <code>checkedState === &quot;checked&quot;</code> even though the runtime value is exactly
          that string, which is also what lands in <code>data-state</code> on the row.
        </p>

        <H2 id="scale">Where the difference stops being about money</H2>
        <p>
          Above roughly 50,000 nodes the comparison changes character. This library stores selection
          as sparse assignments rather than a list of selected IDs, so checking a folder of 50,000
          leaves is one map write — measured at{" "}
          <span className="tnum font-mono">1–3 µs</span> at every tree size from 1,110 to 1,111,110
          nodes. Any component whose public contract is &ldquo;here is the array of selected
          items&rdquo; has to build that array on every change; here you can opt out of building it
          and read <code>getCheckedSubtrees()</code> instead. That is a{" "}
          <Link href="/docs/performance">documented, measured difference</Link>, not a claim about
          MUI&rsquo;s internals.
        </p>

        <Verdict
          otherLabel="MUI X Rich Tree View"
          otherWhen="Your app is already Material UI, your tree is in the hundreds or low thousands, or you need label editing, lazy loading or item reordering. The community tier's tri-state selection is free and good, and if you are buying MUI X Pro for the Data Grid anyway, the virtualized tree comes with it at no extra cost."
          ourWhen="You need virtualization without a per-seat licence, you are not on Material UI, you want the markup to be yours, or your tree is large enough that materializing the selected-IDs array on every click is itself the bottleneck."
        />

        <CompareFooter slug="mui-x-tree-view" />
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
        headline: "react-virtual-checkbox-tree vs MUI X Rich Tree View",
        description:
          "A sourced comparison: MUI X ships tri-state checkbox selection in its free community package and virtualization only in the Pro tier at $299 per developer per year.",
        url: `${site.url}/compare/mui-x-tree-view`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is MUI X Tree View virtualization free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Virtualization is a RichTreeViewPro feature from the @mui/x-tree-view-pro package and requires an MUI X Pro licence, listed at $299 per developer per year. Checkbox selection and selection propagation are free in the MIT community package @mui/x-tree-view.",
            },
          },
          {
            "@type": "Question",
            name: "Does the free MUI X Tree View support indeterminate checkboxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. checkboxSelection enables checkboxes and selectionPropagation with descendants and parents set to true cascades selection in both directions. An item renders as indeterminate when it is not selected but some of its selectable descendants are, with no extra configuration.",
            },
          },
          {
            "@type": "Question",
            name: "Can I use Material UI checkboxes with react-virtual-checkbox-tree?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Pass a renderCheckbox function that renders @mui/material's Checkbox, mapping checkedState to its checked and indeterminate props, and spread the supplied a11yProps object onto it so the control stays aria-hidden and out of the tab order while the row keeps role=treeitem and aria-checked.",
            },
          },
        ],
      },
    ],
  };
}
