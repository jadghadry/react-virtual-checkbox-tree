"use client";

import { useEffect, useRef, useState } from "react";
import { Tree, type TreeDefinition, type TreeRef } from "react-virtual-checkbox-tree";

import { TreeSkin } from "@/components/tree-skin";

/** department → category → subcategories. Generated into a flat map below. */
const CATALOG: Record<string, Record<string, string[]>> = {
  Electronics: {
    Audio: ["Headphones", "Earbuds", "Speakers", "Microphones"],
    Computers: ["Laptops", "Desktops", "Monitors", "Keyboards", "Mice"],
    Photography: ["Mirrorless cameras", "DSLR cameras", "Lenses", "Tripods"],
  },
  Home: {
    Bedding: ["Duvets", "Pillows", "Sheets"],
    Furniture: ["Desks", "Chairs", "Shelving", "Lamps"],
    Kitchen: ["Blenders", "Coffee makers", "Cookware", "Knives"],
  },
  Media: {
    Books: ["Fiction", "Non-fiction", "Reference", "Graphic novels"],
    Games: ["Board games", "Puzzles", "Card games"],
    Music: ["Vinyl", "CDs", "Sheet music"],
  },
  Outdoors: {
    Camping: ["Tents", "Sleeping bags", "Stoves", "Lanterns"],
    Cycling: ["Road bikes", "Gravel bikes", "Helmets", "Bike lights"],
    Running: ["Trail shoes", "Road shoes", "Hydration vests"],
  },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function buildCatalog(): TreeDefinition {
  const data: TreeDefinition = {
    __root__: { children: [], id: "__root__", label: "root" },
  };
  const departments: string[] = [];

  for (const [department, categories] of Object.entries(CATALOG)) {
    const departmentId = slug(department);
    const categoryIds: string[] = [];

    for (const [category, leaves] of Object.entries(categories)) {
      const categoryId = `${departmentId}/${slug(category)}`;
      const leafIds = leaves.map((leaf) => `${categoryId}/${slug(leaf)}`);
      leaves.forEach((leaf, i) => {
        data[leafIds[i]] = { id: leafIds[i], label: leaf };
      });
      data[categoryId] = { children: leafIds, id: categoryId, label: category };
      categoryIds.push(categoryId);
    }

    data[departmentId] = { children: categoryIds, id: departmentId, label: department };
    departments.push(departmentId);
  }

  data.__root__.children = departments;
  return data;
}

const catalog = buildCatalog();
const INITIAL_EXPANDED = ["electronics"];
const DEBOUNCE_MS = 250;

export function FacetedFilterDemo() {
  const [query, setQuery] = useState("");
  const [facets, setFacets] = useState<string[]>([]);
  const [url, setUrl] = useState("/catalog");
  const [matches, setMatches] = useState<null | number>(null);
  const treeRef = useRef<TreeRef>(null);

  // Read the count in an effect, not during render: `<Tree>` applies
  // `searchQuery` in its own effect, and child effects run before the parent's,
  // so by the time this runs the engine has already seen the new query. Reading
  // it during render would show the count for the previous keystroke.
  useEffect(() => {
    const engine = treeRef.current?.getEngine();
    if (!engine) return;
    setMatches(engine.isSearchActive() ? engine.getMatchCount() : null);
  }, [query]);

  // The URL is written on a trailing edge, never per keystroke: a router push
  // per character floods the history stack and re-runs every server component.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (facets.length) params.set("f", facets.slice().sort().join(","));
      const qs = params.toString();
      setUrl(qs ? `/catalog?${qs}` : "/catalog");
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [facets, query]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <input
          aria-label="Filter categories"
          className="min-w-[200px] flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 font-mono text-[13px] outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-accent)]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter facets — try 'bike', 'audio', 'shoes'…"
          value={query}
        />
        <span className="tnum font-mono text-[12px] text-[var(--color-faint)]">
          {matches === null ? "all facets" : `${matches} match${matches === 1 ? "" : "es"}`}
        </span>
      </div>

      <TreeSkin>
        <Tree
          aria-label="Product categories"
          data={catalog}
          estimateSize={30}
          expandedItems={INITIAL_EXPANDED}
          height={300}
          minSearchChars={2}
          onCheck={setFacets}
          ref={treeRef}
          searchQuery={query}
        />
      </TreeSkin>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border)] p-3">
        {facets.length === 0 ? (
          <span className="font-mono text-[12px] text-[var(--color-faint)]">
            No facets selected
          </span>
        ) : (
          <>
            {facets.slice().sort().map((id) => (
              <button
                className="group flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] py-1 pl-2.5 pr-2 text-[12px] transition-colors hover:border-[var(--color-warn)]"
                key={id}
                // Removing a chip goes through the engine, not through a
                // controlled `checkedItems` round-trip — one call, one re-render.
                onClick={() => treeRef.current?.getEngine().toggle(id, false)}
                type="button"
              >
                {catalog[id]?.label ?? id}
                <span aria-hidden="true" className="text-[var(--color-faint)] group-hover:text-[var(--color-warn)]">
                  ×
                </span>
                <span className="sr-only">Remove facet</span>
              </button>
            ))}
            <button
              className="ml-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-faint)] underline underline-offset-2 transition-colors hover:text-[var(--color-fg)]"
              onClick={() => treeRef.current?.getEngine().uncheckAll()}
              type="button"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-2.5">
        <p className="truncate font-mono text-[11.5px] text-[var(--color-faint)]">
          <span className="text-[var(--color-muted)]">history.replaceState</span>(null, &quot;&quot;,{" "}
          <span className="text-[var(--color-ok)]">&quot;{url}&quot;</span>){" "}
          <span className="text-[var(--color-faint)]">— {DEBOUNCE_MS} ms after you stop typing</span>
        </p>
      </div>
    </>
  );
}
