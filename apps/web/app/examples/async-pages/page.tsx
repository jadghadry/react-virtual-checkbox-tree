import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { AsyncPagesDemo } from "@/components/demo-ex-async-pages";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";

export const metadata: Metadata = {
  title: "Paged loading — react-virtual-checkbox-tree",
  description:
    "Grow the data prop as API pages arrive. Selection, expansion and the active search query survive every swap — and there is no onLoadChildren prop.",
  alternates: { canonical: "/examples/async-pages" },
};

const SOURCE = `"use client";

import { useEffect, useMemo, useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

type Page = { nodes: TreeDefinition; rootChildren: string[]; nextCursor: null | string };

async function fetchPage(cursor: null | string): Promise<Page> {
  const response = await fetch("/api/tree?cursor=" + (cursor ?? ""));
  return response.json();
}

export function PagedTree() {
  const [pages, setPages] = useState<Page[]>([]);
  const [cursor, setCursor] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

  // Load the first page on mount.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(null).then((page) => {
      if (cancelled) return;
      setPages([page]);
      setCursor(page.nextCursor);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A brand-new object every time a page lands. That is safe: <Tree> hands it
  // to engine.setData(), which swaps the structure in place rather than
  // rebuilding the engine. Selection, expansion and the active query survive
  // for every node that still exists.
  const data = useMemo<TreeDefinition>(() => {
    const nodes: TreeDefinition = {};
    const rootChildren: string[] = [];
    for (const page of pages) {
      Object.assign(nodes, page.nodes);
      rootChildren.push(...page.rootChildren);
    }
    return {
      __root__: { id: "__root__", label: "root", children: rootChildren },
      ...nodes,
    };
  }, [pages]);

  const loadMore = async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    const page = await fetchPage(cursor);
    // Append the whole page in one setState. Appending node by node would call
    // setData once per node, and setData is linear in the size of the tree.
    setPages((current) => [...current, page]);
    setCursor(page.nextCursor);
    setLoading(false);
  };

  return (
    <div>
      <Tree
        aria-label="Repository"
        data={data}
        estimateSize={30}
        height={280}
        onCheck={setChecked}
      />

      <footer>
        <button disabled={loading || cursor === null} onClick={loadMore} type="button">
          {loading ? "Loading…" : cursor === null ? "All pages loaded" : "Load more"}
        </button>
        <span>{checked.length} selected</span>
      </footer>
    </div>
  );
}`;

const ON_EXPAND = `"use client";

import { useCallback, useRef, useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

/**
 * The closest thing to lazy children: fetch on expand, yourself.
 *
 * There is no onLoadChildren prop and no loading state on a node. What there is
 * is onExpand, which fires with every expanded folder ID — diff it against what
 * you have already fetched and append the results to \`data\`.
 */
export function ExpandToLoad({ initial }: { initial: TreeDefinition }) {
  const [data, setData] = useState<TreeDefinition>(initial);
  const requested = useRef(new Set<string>());

  const onExpand = useCallback(async (expandedFolderIds: string[]) => {
    const fresh = expandedFolderIds.filter((id) => !requested.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) requested.current.add(id);

    const responses = await Promise.all(
      fresh.map((id) => fetch("/api/children/" + id).then((r) => r.json()))
    );

    setData((current) => {
      const next: TreeDefinition = { ...current };
      for (let i = 0; i < fresh.length; i++) {
        const parentId = fresh[i];
        const children = responses[i] as TreeDefinition;
        Object.assign(next, children);
        next[parentId] = { ...next[parentId], children: Object.keys(children) };
      }
      return next;
    });
  }, []);

  return <Tree aria-label="Repository" data={data} height={280} onExpand={onExpand} />;
}`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="The tree comes from an API that pages: the first response holds the top of the repository and more arrives as you ask for it. The user should be able to check files and open folders while that is still happening, without anything they did being undone when the next page lands."
        title="Paged loading"
        why="A tree is right here because the pages are branches, not rows — each response fills in part of a hierarchy the user is already navigating. The alternative, re-mounting a list when data changes, is exactly what loses the selection."
      />

      <ExampleBody>
        <ExampleSection
          lede="Check a file, open a folder, then load the next page. The counters underneath keep their values across every swap of the data prop."
          title="The demo"
        >
          <DemoFrame note="Each page is a setTimeout standing in for a fetch, at 700 ms.">
            <AsyncPagesDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="Complete, with a cursor-paged endpoint. The only thing that makes this work is that data is rebuilt as one new object per page."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="paged-tree.tsx" />
        </ExampleSection>

        <ExampleSection
          lede="If what you actually want is children fetched when a folder opens, this is the shape it has to take: onExpand plus a set of IDs you have already asked for."
          title="Fetching on expand instead"
        >
          <CodeBlock code={ON_EXPAND} filename="expand-to-load.tsx" />
        </ExampleSection>

        <ExampleSection title="Props exercised">
          <PropsExercised
            items={[
              {
                name: "data",
                note: "Passing a new object is safe. The structure is swapped in place through engine.setData(); state is preserved for nodes that still exist and pruned for nodes that vanished.",
              },
              {
                name: "onCheck",
                note: "Keeps firing across data changes, with leaf IDs that survive the swap. A leaf removed by a later page stops appearing, and its assignment is dropped.",
              },
              {
                name: "onExpand",
                note: "Every expanded folder ID, including the structural __root__ — filter it out before you show a count.",
              },
              {
                name: "estimateSize",
                note: "Fixed row height. Nothing about paging needs a dynamic one: rows appear at the bottom of the flattened list, not in the middle of a measured layout.",
              },
              {
                name: "height",
                note: "A fixed scroll container height, so the viewport does not jump as the tree grows underneath it.",
              },
              {
                name: "searchQuery",
                note: "An active query is re-applied to the new structure after every setData, so results from a later page join the filtered view without retyping.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="There is no lazy loading. There is no onLoadChildren prop." type="warn">
            <p>
              Say it plainly, because this is the feature people assume is there: the engine wants
              the whole map up front. There is no <code>onLoadChildren</code>, no{" "}
              <code>isLoading</code> flag on a node, no placeholder spinner row, and no way to
              declare a folder whose children are unknown. A node with{" "}
              <code>{"children: []"}</code> is a leaf, with a checkbox, today and permanently — not
              a folder waiting to be filled.
            </p>
            <p>
              What you can do is rebuild <code>data</code> as results arrive, which is what both
              recipes above do, and it genuinely preserves what the user did. The cost to know
              about: <code>setData</code> is linear in node count — roughly 115 ms at 111,110 nodes
              — and it runs on every identity change of the prop. Append a page at a time, never a
              node at a time, and never rebuild <code>data</code> inline in the render body where
              every keystroke elsewhere in the component triggers a fresh one.
            </p>
            <p>
              One more consequence worth stating: a folder whose children have not loaded yet cannot
              be checked meaningfully, because its state is derived from descendants that do not
              exist. Ticking it selects the leaves you have, not the ones you have not fetched.
            </p>
          </Callout>
        </ExampleSection>

        <ExampleNav
          next={{ href: "/docs/recipes/async-children", label: "Docs: loading data in pages" }}
          prev={{ href: "/examples/engine-only", label: "Engine only" }}
        />
      </ExampleBody>
    </>
  );
}
