import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { FacetedFilterDemo } from "@/components/demo-ex-faceted";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";

export const metadata: Metadata = {
  title: "Faceted filter — react-virtual-checkbox-tree",
  description:
    "A deep category tree as a search facet panel: ancestor-aware filtering, removable facet chips, and a debounced write of the selection to the URL.",
  alternates: { canonical: "/examples/faceted-filter" },
};

const SOURCE = `"use client";

import { useEffect, useRef, useState } from "react";
import { Tree, type TreeDefinition, type TreeRef } from "react-virtual-checkbox-tree";

/** department → category → subcategories, flattened into the map below. */
const CATALOG: Record<string, Record<string, string[]>> = {
  Electronics: {
    Audio: ["Headphones", "Earbuds", "Speakers", "Microphones"],
    Computers: ["Laptops", "Desktops", "Monitors", "Keyboards", "Mice"],
  },
  Outdoors: {
    Camping: ["Tents", "Sleeping bags", "Stoves", "Lanterns"],
    Cycling: ["Road bikes", "Gravel bikes", "Helmets", "Bike lights"],
  },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function buildCatalog(): TreeDefinition {
  const data: TreeDefinition = { __root__: { id: "__root__", label: "root", children: [] } };
  const departments: string[] = [];

  for (const [department, categories] of Object.entries(CATALOG)) {
    const departmentId = slug(department);
    const categoryIds: string[] = [];

    for (const [category, leaves] of Object.entries(categories)) {
      const categoryId = departmentId + "/" + slug(category);
      const leafIds = leaves.map((leaf) => categoryId + "/" + slug(leaf));
      leaves.forEach((leaf, i) => {
        data[leafIds[i]] = { id: leafIds[i], label: leaf };
      });
      data[categoryId] = { id: categoryId, label: category, children: leafIds };
      categoryIds.push(categoryId);
    }

    data[departmentId] = { id: departmentId, label: department, children: categoryIds };
    departments.push(departmentId);
  }

  data.__root__.children = departments;
  return data;
}

const catalog = buildCatalog();
const INITIAL_EXPANDED = ["electronics"];
const DEBOUNCE_MS = 250;

export function FacetedFilter() {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<string[]>([]);
  const treeRef = useRef<TreeRef>(null);

  // One router write per pause, not one per keystroke. Without this you push a
  // history entry per character and re-run every server component with it.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (facets.length) params.set("f", [...facets].sort().join(","));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? "?" + qs : location.pathname);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [facets, query]);

  return (
    <div>
      <input
        aria-label="Filter categories"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter facets…"
        value={query}
      />

      <Tree
        aria-label="Product categories"
        data={catalog}
        estimateSize={30}
        expandedItems={INITIAL_EXPANDED}
        height={300}
        // Two characters is enough for a 60-node taxonomy; the default is 3.
        minSearchChars={2}
        onCheck={setFacets}
        ref={treeRef}
        searchQuery={query}
      />

      <div>
        {[...facets].sort().map((id) => (
          <button
            key={id}
            // Removing a chip goes straight to the engine. Round-tripping it
            // through a controlled \`checkedItems\` prop is a render slower and,
            // because the prop is applied in an effect, a frame stale.
            onClick={() => treeRef.current?.getEngine().toggle(id, false)}
            type="button"
          >
            {catalog[id]?.label ?? id} ×
          </button>
        ))}
        {facets.length > 0 && (
          <button onClick={() => treeRef.current?.getEngine().uncheckAll()} type="button">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}`;

const READ_BACK = `"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Tree } from "react-virtual-checkbox-tree";

// The same flat map \`buildCatalog()\` returns above, exported from its own file
// so both halves of the round trip share one tree.
import { catalog } from "./catalog";

/**
 * Reading the URL back on load. \`checkedItems\` is applied whenever the array's
 * identity changes, so it must be memoized — rebuilt on every render, it fights
 * the user for control of the selection.
 */
export function FacetsFromUrl() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const initialFacets = useMemo(
    () => (params.get("f") ?? "").split(",").filter(Boolean),
    [params]
  );

  return (
    <Tree
      aria-label="Product categories"
      checkedItems={initialFacets}
      data={catalog}
      height={300}
      minSearchChars={2}
      onCheck={(ids) => console.log(ids)}
      searchQuery={query}
    />
  );
}`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="A catalog sidebar: sixty-odd categories three levels deep, a box to find one without scrolling, and chips showing what is currently narrowing the results. The chosen facets belong in the URL so the search is shareable and survives a reload."
        title="Faceted filter"
        why="Facets are naturally nested — picking Cycling should mean every subcategory under it — and a flat checkbox list forces the user to tick five boxes for what is one idea. The tri-state parent is also the summary: one glance says whether a department is fully or partly selected."
      />

      <ExampleBody>
        <ExampleSection
          lede="Type two characters to filter. Matches surface with their ancestors already unfolded; clearing the box gives you back the folders you had open."
          title="The demo"
        >
          <DemoFrame note="The line at the bottom shows the call the debounce would make. It is printed rather than executed, so browsing the docs does not rewrite this page's own URL — the real write is in the source below. Type quickly and watch it settle once, 250 ms after you stop.">
            <FacetedFilterDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="Trimmed to two departments so it fits on a screen; the demo above uses four. Everything else is identical."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="faceted-filter.tsx" />
        </ExampleSection>

        <ExampleSection
          lede="The other half of the round trip: restoring the selection and the query from the URL on first load."
          title="Reading it back"
        >
          <CodeBlock code={READ_BACK} filename="facets-from-url.tsx" />
        </ExampleSection>

        <ExampleSection title="Props exercised">
          <PropsExercised
            items={[
              {
                name: "searchQuery",
                note: "Filters to matches and their ancestors. Matching is diacritic- and case-insensitive, so resume finds Résumé.",
              },
              {
                name: "minSearchChars",
                note: "Characters required before the query takes effect. Defaults to 3; this tree is small enough for 2.",
              },
              {
                name: "searchScope",
                note: 'Left at its default of "all", so a matching category carries its whole subtree into the filtered view — type "audio" and every product under it stays selectable. Pass "leaves" to match only leaf labels.',
              },
              {
                name: "onCheck",
                note: "Drives the chips. Leaf IDs only, so a chip always corresponds to one real facet.",
              },
              {
                name: "ref → getEngine()",
                note: "toggle(id, false) removes one facet and uncheckAll() clears them, without making the selection a controlled prop.",
              },
              {
                name: "expandedItems",
                note: "Opens the first department on load. While a search is active the engine manages expansion itself, and restores yours when the query clears.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="Debounce before the URL, never before the tree" type="warn">
            <p>
              Two different clocks are at work and they get conflated. Filtering the tree is cheap —
              a search keystroke over 111,110 nodes measures 11.5 ms, and this catalog is a
              thousandth of that — so <code>searchQuery</code> should track the input on every
              keystroke and stay perfectly responsive.
            </p>
            <p>
              Writing the URL is not cheap. A <code>router.push</code> per character stacks one
              history entry per character, so Back becomes useless, and in the App Router each write
              re-runs the server components under it. Debounce that side, on a trailing edge, around
              200&ndash;300 ms — and prefer <code>replace</code> over <code>push</code> for filter
              state.
            </p>
            <p>
              If your tree really is large enough to feel the filter, the fix is still not a
              debounce on <code>searchQuery</code>: wrap it in{" "}
              <code>useDeferredValue</code> so the input stays live while the row list catches up.
            </p>
          </Callout>
        </ExampleSection>

        <ExampleNav
          next={{ href: "/examples/engine-only", label: "Engine only" }}
          prev={{ href: "/examples/shadcn-styled", label: "shadcn/ui styled" }}
        />
      </ExampleBody>
    </>
  );
}
