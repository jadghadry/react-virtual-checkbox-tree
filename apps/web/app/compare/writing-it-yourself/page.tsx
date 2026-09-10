import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/code-block";
import { CompareNaiveBugs } from "@/components/demo-compare-naive-bugs";
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
  title: "vs writing it yourself — react-virtual-checkbox-tree",
  description:
    "Hand-rolling a checkbox tree is correct under a few hundred nodes. Here is the naive version, and the four bugs you will write once it grows.",
  alternates: { canonical: "/compare/writing-it-yourself" },
};

const SRC = `${site.repo}/blob/main/packages/react-virtual-checkbox-tree/src`;

const NAIVE = `// The version almost everyone writes first. It is fine. Really.
import { useState } from "react";

type Node = { children?: Node[]; id: string; label: string };

const data: Node[] = [
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

function leavesUnder(node: Node): string[] {
  return node.children?.length ? node.children.flatMap(leavesUnder) : [node.id];
}

function stateOf(node: Node, checked: Set<string>): "checked" | "indeterminate" | "unchecked" {
  if (!node.children?.length) return checked.has(node.id) ? "checked" : "unchecked";
  const hits = node.children.filter((child) => checked.has(child.id)).length;
  if (hits === 0) return "unchecked";
  return hits === node.children.length ? "checked" : "indeterminate";
}

function Row({
  checked,
  level,
  node,
  onToggle,
}: {
  checked: Set<string>;
  level: number;
  node: Node;
  onToggle: (node: Node, next: boolean) => void;
}) {
  const state = stateOf(node, checked);
  return (
    <>
      <div style={{ paddingLeft: level * 20 }}>
        <input
          checked={state === "checked"}
          onChange={(event) => onToggle(node, event.target.checked)}
          ref={(el) => {
            if (el) el.indeterminate = state === "indeterminate";
          }}
          type="checkbox"
        />
        {node.label}
      </div>
      {node.children?.map((child) => (
        <Row checked={checked} key={child.id} level={level + 1} node={child} onToggle={onToggle} />
      ))}
    </>
  );
}

export default function App() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const onToggle = (node: Node, next: boolean) => {
    setChecked((prev) => {
      const out = new Set(prev);
      for (const id of leavesUnder(node)) next ? out.add(id) : out.delete(id);
      return out;
    });
  };

  return (
    <div>
      {data.map((node) => (
        <Row checked={checked} key={node.id} level={0} node={node} onToggle={onToggle} />
      ))}
    </div>
  );
}`;

const FIX_ONE = `// The fix for bug 1: derive a folder's state from its children's *states*,
// not from whether its children appear in a flat set of ids.
type Node = { children?: Node[]; id: string; label: string };

function stateOf(node: Node, checked: Set<string>): "checked" | "indeterminate" | "unchecked" {
  if (!node.children?.length) return checked.has(node.id) ? "checked" : "unchecked";

  let allChecked = true;
  let anyChecked = false;
  for (const child of node.children) {
    const state = stateOf(child, checked); // recurses to the leaves, every render
    if (state === "indeterminate") return "indeterminate";
    if (state === "checked") anyChecked = true;
    else allChecked = false;
  }
  if (allChecked) return "checked";
  return anyChecked ? "indeterminate" : "unchecked";
}`;

const FIX_THREE = `// The fix for bug 3, in outline: the cascade has to know about the filter.
type Node = { children?: Node[]; id: string; label: string };

function visibleLeavesUnder(node: Node, visible: Set<string>): string[] {
  if (!visible.has(node.id)) return [];
  if (!node.children?.length) return [node.id];
  return node.children.flatMap((child) => visibleLeavesUnder(child, visible));
}

// ...and stateOf has to summarize visible children only, or a folder showing
// 2 of its 800 files reads as indeterminate when both visible ones are checked.
// You now have two state functions and two cascade functions, and they must
// agree about what "visible" means at all times.`;

export default function Page() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        type="application/ld+json"
      />

      <CompareHeader
        eyebrow="Compare"
        lede="Under a few hundred nodes, writing it yourself is the right answer, and this page is not going to pretend otherwise. Eighty lines, no dependency, no 0.x API to track, and it does exactly what your product needs. Ship it."
        title="react-virtual-checkbox-tree vs writing it yourself"
      />

      <CompareBody>
        <p>
          The real competitor to this library is not another library. It is the afternoon you were
          going to spend on a recursive component and a <code>Set</code>. That afternoon is a good
          investment when the tree is small, the requirements are shallow and nobody has asked for
          search yet.
        </p>
        <p>
          What follows is not an argument against it. It is the list of four bugs the hand-rolled
          version develops as the tree grows, in the order they show up, with the line in this
          repository that handles each one. If none of the four describe your situation, close this
          tab and go write the component.
        </p>

        <FactTable
          facts={[
            { label: "Hand-rolled version", value: "~80 lines, 0 dependencies, 0 kB" },
            {
              label: "This library",
              value: "5.6 kB gzipped, 1 dependency, v" + site.version,
              source: site.repo,
              sourceLabel: "source",
            },
            { label: "Where hand-rolling is correct", value: "Roughly under 500 nodes, no search" },
            { label: "Where it starts hurting", value: "Depth 3+, or a filter, or ~2,000 nodes" },
            { label: "Last verified", value: VERIFIED_ON },
          ]}
          title="The honest framing"
        />

        <H2 id="the-naive-version">The version you are about to write</H2>
        <p>
          This is a complete, working checkbox tree. It cascades, it shows indeterminate parents, it
          is readable, and for a settings panel with twelve options it is strictly better than
          installing anything.
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={NAIVE} filename="naive-tree.tsx" />
        </div>

        <H2 id="bug-1">Bug 1: the indeterminate state stops at depth 2</H2>
        <p>
          <strong>
            <code>stateOf</code> asks whether a folder&rsquo;s <em>direct children</em> are in the
            checked set. Grandchildren are not in that set, so a folder whose grandchildren are
            partly checked reads as fully unchecked.
          </strong>
        </p>
        <p>
          With <code>tree.tsx</code> checked and nothing else: <code>ui</code> correctly shows
          indeterminate, because <code>tree</code> is in the set and <code>row</code> is not. But{" "}
          <code>src</code> looks at <code>engine</code> and <code>ui</code>, finds neither in the
          set, counts zero, and renders unchecked. The user checked a file and the folder above the
          folder above it says nothing is selected.
        </p>
        <p>Click through it — the left pane is exactly the code above:</p>

        <div className="my-6">
          <CompareNaiveBugs />
        </div>

        <p>
          The fix looks small, and it is — the first time. Recurse on states instead of membership:
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={FIX_ONE} filename="fix-1.ts" lang="ts" />
        </div>

        <p>
          That is correct and it is O(subtree) per folder per render. In this repository the same
          derivation is an iterative post-order walk with a memo cache and a fast path that skips any
          branch containing no assignments at all —{" "}
          <a href={`${SRC}/engine.ts`} rel="noreferrer noopener" target="_blank">
            <code>computeState</code> in engine.ts
          </a>
          . It is iterative rather than recursive for a reason the tests cover: a 10,000-deep chain
          must not blow the call stack.
        </p>

        <H2 id="bug-2">Bug 2: every checkbox click re-renders every node</H2>
        <p>
          <strong>
            The naive tree renders one DOM element per node and recomputes every parent&rsquo;s state
            on every click, so a check costs O(nodes) twice over.
          </strong>
        </p>
        <p>
          At 200 nodes you will never notice. At 5,000 the click feels mushy. At 50,000 the tab
          stops responding, and the profiler will point at <code>stateOf</code> — the fixed version,
          the one that recurses to the leaves for every folder on every render.
        </p>
        <p>There are two separate problems hiding in that sentence, and they need two separate fixes.</p>
        <ul>
          <li>
            <strong>The DOM.</strong> Rows have to be virtualized, which means a scroll container, a
            measured row height, absolute positioning and a spacer. Here that is{" "}
            <code>@tanstack/react-virtual</code> wired up in{" "}
            <a href={`${SRC}/tree.tsx`} rel="noreferrer noopener" target="_blank">
              tree.tsx
            </a>
            , with <code>estimateSize</code>, <code>overscan</code> and <code>indent</code> exposed as
            props. Roughly twenty rows are mounted whether the tree holds a hundred nodes or a
            million.
          </li>
          <li>
            <strong>The state.</strong> Selection is stored as sparse <em>assignments</em>, not as a
            set of checked ids: checking a folder of 50,000 leaves writes one map entry and then
            drops any stale assignments below it. That is{" "}
            <a href={`${SRC}/engine.ts`} rel="noreferrer noopener" target="_blank">
              <code>toggleFull</code> and <code>clearSubtreeAssignments</code>
            </a>
            . Measured cost: <span className="tnum font-mono">3 µs</span> at 1,110 nodes,{" "}
            <span className="tnum font-mono">1 µs</span> at 1,111,110.
          </li>
        </ul>
        <p>
          There is a third piece that is easy to miss. A selection change does not move any row, so
          the flattened row list must not be rebuilt when one happens. The engine tracks a{" "}
          <code>structureVersion</code> and a <code>selectionVersion</code> separately and{" "}
          <code>notifySelection()</code> deliberately does not touch the former, which is why
          checking a box in a 111,110-node tree does not pay the 25 ms flatten. A hand-rolled
          version that keeps one <code>version</code> counter pays it on every click.
        </p>

        <H2 id="bug-3">Bug 3: select-all while filtered selects things nobody could see</H2>
        <p>
          <strong>
            The moment you add a search box, <code>leavesUnder()</code> becomes wrong, because it
            does not know the filter exists.
          </strong>
        </p>
        <p>
          The user filters 800 files down to 12, clicks the folder checkbox to take &ldquo;all of
          them&rdquo;, clears the filter — and has selected 800 files. This one does not throw, does
          not warn, and does not show up in a demo with nine nodes. It shows up as a support ticket
          about a bulk operation that touched the wrong records. Switch the demo above to the second
          tab, type <code>tree</code>, and click <code>src</code>.
        </p>

        <div className="not-prose my-6">
          <CodeBlock code={FIX_THREE} filename="fix-3.ts" lang="ts" />
        </div>

        <p>
          In this repository that is{" "}
          <a href={`${SRC}/engine.ts`} rel="noreferrer noopener" target="_blank">
            <code>toggleVisibleOnly</code> and <code>getStateFiltered</code>
          </a>
          : while a query is active, a toggle walks the filtered child map instead of the real one,
          and a folder&rsquo;s tri-state summarizes only its visible children. Filter to twelve
          matches, check the folder, clear the filter, and exactly those twelve are checked. Clearing
          the query also restores the expansion the user had before they started typing — a snapshot
          taken when search activates and put back when it clears. See{" "}
          <Link href="/docs/search">Search</Link>.
        </p>

        <H2 id="bug-4">Bug 4: the selection dies when the data updates</H2>
        <p>
          <strong>
            A new <code>data</code> array arrives from the server, the component rebuilds whatever it
            derived from the old one, and the user&rsquo;s selection and open folders go with it.
          </strong>
        </p>
        <p>
          This one has several disguises. Storing <code>checked</code> on the node objects
          themselves, so a fresh fetch wipes it. Keying rows by index, so an insert at the top shifts
          every checkbox down one. A <code>useMemo</code> over <code>data</code> that rebuilds a
          parent map and drops the ids that no longer resolve. Or the honest version: a{" "}
          <code>useEffect</code> that resets state when <code>data</code> changes, because keeping it
          consistent was harder than clearing it.
        </p>
        <p>
          Passing a brand-new <code>data</code> object to <code>&lt;Tree&gt;</code> is safe. The
          structure is swapped in place by{" "}
          <a href={`${SRC}/engine.ts`} rel="noreferrer noopener" target="_blank">
            <code>engine.setData()</code>
          </a>
          , not rebuilt around: assignments and expansion for nodes that still exist are kept, state
          for nodes that vanished is pruned, the assignment counts are rebuilt, and the active query
          is re-run against the new structure. The tests assert all four of those, and it is what
          makes <Link href="/docs/recipes/async-children">loading data in pages</Link> work without an{" "}
          <code>onLoadChildren</code> prop.
        </p>

        <H2 id="what-else">What else you would end up writing</H2>
        <p>
          The four bugs are the ones that bite. These are the things that simply take time, and none
          of them are hard — they are just all of them.
        </p>
        <ul>
          <li>
            <strong>The ARIA tree.</strong> <code>role=&quot;tree&quot;</code> with{" "}
            <code>aria-multiselectable</code>, <code>role=&quot;treeitem&quot;</code> with{" "}
            <code>aria-level</code>, <code>aria-setsize</code>, <code>aria-posinset</code> and{" "}
            <code>aria-checked=&quot;mixed&quot;</code>. Virtualization flattens the DOM, so the
            nesting a screen reader would infer from <code>role=&quot;group&quot;</code> wrappers is
            not there — <code>aria-posinset</code> and <code>aria-setsize</code> are how the tree
            stays navigable anyway.
          </li>
          <li>
            <strong>Focus that survives unmounting.</strong> If a row owns DOM focus and the
            virtualizer scrolls it away, the focus goes with it. Here focus stays on the container
            and the active row is tracked with <code>aria-activedescendant</code>.
          </li>
          <li>
            <strong>The keyboard.</strong> ArrowUp/Down/Left/Right with the collapse-to-parent
            behaviour, Home, End, Space, Enter, <code>*</code> to expand everything, Ctrl/Cmd+A to
            select all or clear, and type-ahead with a 600 ms buffer.
          </li>
          <li>
            <strong>Data you did not sanitize.</strong> A child id with no entry of its own, a node
            listed under two parents, a cycle. The engine always drops dangling references, and in
            development it warns about them, warns that only the last parent of a two-parent node
            wins, and throws on a cycle rather than hanging.
          </li>
          <li>
            <strong>Diacritics.</strong> <code>resume</code> should find <code>Résumé</code>.
          </li>
        </ul>

        <Concede title="And the case for still writing it yourself">
          <ul>
            <li>
              <strong>Zero dependencies beats 5.6 kB.</strong> No supply chain, no version bumps, no
              breaking change in someone else&rsquo;s 0.x.
            </li>
            <li>
              <strong>You can change anything.</strong> Checkable folders, a fourth state, per-node
              disabling, a cascade that skips disabled leaves — all trivial in code you own, and
              several of them are impossible here.
            </li>
            <li>
              <strong>It is v{site.version} with eight downloads a week.</strong> The API will move
              before 1.0. If you cannot tolerate that, your own eighty lines are more stable than
              this package is.
            </li>
            <li>
              <strong>Most trees never grow.</strong> The 500-node settings tree you are worried
              about is, statistically, going to still be a 500-node settings tree in three years.
            </li>
          </ul>
        </Concede>

        <Verdict
          otherLabel="your own code"
          otherWhen="The tree is small, the depth is shallow, there is no search box, the data does not change under the user, and nobody is going to run an accessibility audit on it. That is most trees. Eighty lines and no dependency is a genuinely good outcome and you should not feel bad about it."
          ourWhen="You have hit two or more of the four bugs above, or you can see them coming: the tree is deeper than two levels, there is a filter, the data refetches, or the node count has a comma in it. Everything described on this page is already written, tested and measured."
        >
          <p className="mt-3 text-[13.5px] text-[var(--color-muted)]">
            <Link
              className="text-[var(--color-accent)] underline underline-offset-3"
              href="/docs/quick-start"
            >
              A complete working tree in one file →
            </Link>
          </p>
        </Verdict>

        <CompareFooter slug="writing-it-yourself" />
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
        headline: "Writing a React checkbox tree yourself: the four bugs you will write",
        description:
          "The naive recursive checkbox tree, and where it breaks: indeterminate propagation past depth 2, O(n) re-renders, select-all while filtered, and losing state when data updates.",
        url: `${site.url}/compare/writing-it-yourself`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Should I write my own React checkbox tree?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, if the tree is under a few hundred nodes, no more than two or three levels deep, has no search box, and its data does not change under the user. About eighty lines gets you a correct cascading tree with no dependency. Reach for a library once the tree is deeper, filterable, refetched, or large enough that rendering every node is visible.",
            },
          },
          {
            "@type": "Question",
            name: "Why does my indeterminate checkbox state not propagate to grandparents?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Because the parent's state is being derived from whether its direct children appear in a flat set of checked ids. Grandchildren are not in that set, so a folder whose grandchildren are partly checked counts zero checked children and renders unchecked. The fix is to derive each folder's state from its children's states recursively, rather than from set membership.",
            },
          },
          {
            "@type": "Question",
            name: "What goes wrong when you select all in a filtered tree?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A cascade written as 'every leaf under this node' does not know the filter exists, so clicking a folder checkbox while filtered selects every descendant, including the ones the filter hid. The user sees twelve matches, clicks the folder, and selects eight hundred records. The cascade has to walk the filtered child list instead, and the folder's tri-state has to summarize only visible children.",
            },
          },
          {
            "@type": "Question",
            name: "How do I keep a tree selection when the data updates?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Swap the structure in place instead of rebuilding the state around it: keep selection and expansion for nodes that still exist, prune state for nodes that disappeared, and re-run any active search query against the new structure. react-virtual-checkbox-tree does this in engine.setData(), which is why passing a brand-new data object to Tree is safe.",
            },
          },
        ],
      },
    ],
  };
}
