import { describe, expect, it, vi } from "vitest";

import { CheckedState } from "../src/constants";
import { Engine } from "../src/engine";
import type { TreeDefinition } from "../src/types";
import { fileTree, makeDeepChain, makeTree } from "./fixtures";

const ids = (engine: Engine) => engine.getVisibleItems().map((row) => row.id);

describe("structure", () => {
  it("renders only top-level rows until folders are expanded", () => {
    const engine = new Engine(fileTree);
    expect(ids(engine)).toEqual(["docs", "src"]);
  });

  it("flattens expanded folders depth-first with correct levels", () => {
    const engine = new Engine(fileTree, { initialExpanded: ["docs", "src", "ui"] });
    expect(ids(engine)).toEqual([
      "docs",
      "readme",
      "guide",
      "src",
      "engine",
      "ui",
      "tree",
      "row",
    ]);
    const byId = Object.fromEntries(engine.getVisibleItems().map((r) => [r.id, r]));
    expect(byId.docs.level).toBe(0);
    expect(byId.readme.level).toBe(1);
    expect(byId.tree.level).toBe(2);
  });

  it("reports aria-setsize and aria-posinset per sibling group", () => {
    const engine = new Engine(fileTree, { initialExpanded: ["docs"] });
    const rows = engine.getVisibleItems();
    expect(rows[0]).toMatchObject({ id: "docs", posInSet: 1, setSize: 2 });
    expect(rows[1]).toMatchObject({ id: "readme", posInSet: 1, setSize: 2 });
    expect(rows[2]).toMatchObject({ id: "guide", posInSet: 2, setSize: 2 });
    expect(rows[3]).toMatchObject({ id: "src", posInSet: 2, setSize: 2 });
  });

  it("drops child IDs that have no entry of their own instead of crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data: TreeDefinition = {
      __root__: { id: "__root__", label: "root", children: ["a", "ghost"] },
      a: { id: "a", label: "A" },
    };
    const engine = new Engine(data);
    expect(ids(engine)).toEqual(["a"]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws on cyclic data rather than hanging", () => {
    const data: TreeDefinition = {
      __root__: { id: "__root__", label: "root", children: ["a"] },
      a: { id: "a", label: "A", children: ["b"] },
      b: { id: "b", label: "B", children: ["a"] },
    };
    expect(() => new Engine(data)).toThrow(/Cycle detected/);
  });

  it("survives a 10,000-deep chain without blowing the stack", () => {
    const engine = new Engine(makeDeepChain(10_000));
    engine.expandAll();
    expect(engine.getVisibleItems()).toHaveLength(10_000);
    engine.toggle("d0", true);
    expect(engine.getState("d9999")).toBe(CheckedState.Checked);
    expect(engine.getAllChecked()).toEqual(["d9999"]);
  });
});

describe("tri-state", () => {
  it("derives indeterminate on partially checked folders", () => {
    const engine = new Engine(fileTree);
    engine.toggle("readme", true);
    expect(engine.getState("readme")).toBe(CheckedState.Checked);
    expect(engine.getState("docs")).toBe(CheckedState.Indeterminate);
    expect(engine.getState("__root__")).toBe(CheckedState.Indeterminate);
    expect(engine.getState("src")).toBe(CheckedState.Unchecked);
  });

  it("promotes a folder to checked once every child is checked", () => {
    const engine = new Engine(fileTree);
    engine.toggle("readme", true);
    engine.toggle("guide", true);
    expect(engine.getState("docs")).toBe(CheckedState.Checked);
  });

  it("cascades a folder toggle through the whole subtree", () => {
    const engine = new Engine(fileTree);
    engine.toggle("src", true);
    expect(engine.getAllChecked().sort()).toEqual(["engine", "row", "tree"]);
    expect(engine.getState("ui")).toBe(CheckedState.Checked);
  });

  it("never reports folder IDs from getAllChecked", () => {
    const engine = new Engine(fileTree);
    engine.checkAll();
    expect(engine.getAllChecked().sort()).toEqual([
      "engine",
      "guide",
      "readme",
      "row",
      "tree",
    ]);
  });

  it("clears stale descendant assignments when an ancestor is toggled", () => {
    const engine = new Engine(fileTree);
    engine.toggle("tree", true);
    engine.toggle("src", false);
    expect(engine.getAllChecked()).toEqual([]);
    engine.toggle("src", true);
    expect(engine.getAllChecked().sort()).toEqual(["engine", "row", "tree"]);
  });

  it("stores one assignment for a whole-subtree toggle", () => {
    const engine = new Engine(fileTree);
    engine.toggle("src", true);
    expect(engine.getCheckedSubtrees()).toEqual([{ checked: true, id: "src" }]);
  });

  it("round-trips a sparse selection", () => {
    const engine = new Engine(fileTree);
    engine.toggle("src", true);
    engine.toggle("engine", false);
    const sparse = engine.getCheckedSubtrees();

    const restored = new Engine(fileTree);
    restored.setCheckedSubtrees(sparse);
    expect(restored.getAllChecked().sort()).toEqual(engine.getAllChecked().sort());
  });

  it("ignores folder IDs passed to setChecked", () => {
    const engine = new Engine(fileTree);
    engine.setChecked(["docs", "readme"]);
    expect(engine.getAllChecked()).toEqual(["readme"]);
  });

  it("does not fire observers when setChecked is a no-op", () => {
    const engine = new Engine(fileTree);
    engine.setChecked(["readme"]);
    const spy = vi.fn();
    engine.subscribe(spy);
    engine.setChecked(["readme"]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("expansion", () => {
  it("keeps the root expanded and out of the rendered rows", () => {
    const engine = new Engine(fileTree);
    expect(engine.getExpanded()).toContain("__root__");
    expect(ids(engine)).not.toContain("__root__");
  });

  it("converges when a controlled consumer echoes back what it was given", () => {
    const engine = new Engine(fileTree);
    engine.setExpanded(["docs"]);
    const first = engine.getExpanded();

    const spy = vi.fn();
    engine.subscribe(spy);
    // The consumer hands back exactly what onExpand gave it, root included.
    engine.setExpanded(first);
    expect(spy).not.toHaveBeenCalled();

    // And the same list without the root must also settle, not oscillate.
    engine.setExpanded(first.filter((id) => id !== "__root__"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("reveals a node by expanding its ancestors", () => {
    const engine = new Engine(fileTree);
    expect(engine.indexOf("tree")).toBe(-1);
    engine.revealNode("tree");
    expect(engine.indexOf("tree")).toBeGreaterThanOrEqual(0);
  });
});

describe("search", () => {
  it("stays inactive below minSearchChars", () => {
    const engine = new Engine(fileTree, { minSearchChars: 3 });
    engine.setSearchQuery("re");
    expect(engine.isSearchActive()).toBe(false);
    expect(ids(engine)).toEqual(["docs", "src"]);
  });

  it("shows matches with their ancestors", () => {
    const engine = new Engine(fileTree);
    engine.setSearchQuery("readme");
    expect(engine.isSearchActive()).toBe(true);
    expect(ids(engine)).toEqual(["docs", "readme"]);
  });

  it("matches folder labels by default and carries the subtree", () => {
    const engine = new Engine(fileTree);
    engine.setSearchQuery("docs");
    expect(engine.getMatchCount()).toBe(1);
    // The folder matched, so its children are reachable...
    expect(ids(engine)).toEqual(["docs"]);
    // ...and checking it selects everything under it.
    engine.toggle("docs", true);
    expect(engine.getAllChecked().sort()).toEqual(["guide", "readme"]);
  });

  it("can be restricted to leaf labels only", () => {
    const engine = new Engine(fileTree, { searchScope: "leaves" });
    engine.setSearchQuery("docs");
    expect(engine.getMatchCount()).toBe(0);
  });

  it("is diacritics- and case-insensitive", () => {
    const engine = new Engine({
      __root__: { id: "__root__", label: "root", children: ["cv"] },
      cv: { id: "cv", label: "Résumé.pdf" },
    });
    engine.setSearchQuery("resume");
    expect(ids(engine)).toEqual(["cv"]);
  });

  it("restores the user's expansion when the query is cleared", () => {
    const engine = new Engine(fileTree);
    engine.setExpanded(["docs", "src", "ui"]);
    const before = engine.getExpanded().sort();

    engine.setSearchQuery("readme");
    expect(engine.getExpanded().sort()).not.toEqual(before);

    engine.setSearchQuery("");
    expect(engine.getExpanded().sort()).toEqual(before);
    expect(ids(engine)).toEqual(["docs", "readme", "guide", "src", "engine", "ui", "tree", "row"]);
  });

  it("toggles only visible leaves while filtered, leaving hidden ones alone", () => {
    const engine = new Engine(fileTree);
    engine.setSearchQuery("readme");
    engine.toggle("docs", true);
    expect(engine.getAllChecked()).toEqual(["readme"]);

    engine.setSearchQuery("");
    // guide.md was hidden during the filter and must be untouched.
    expect(engine.getAllChecked()).toEqual(["readme"]);
    expect(engine.getState("docs")).toBe(CheckedState.Indeterminate);
  });

  it("summarizes folders over visible children only while filtered", () => {
    const engine = new Engine(fileTree);
    engine.setSearchQuery("readme");
    engine.toggle("readme", true);
    // docs shows 1 of its 2 files, and that one is checked.
    expect(engine.getViewState("docs")).toBe(CheckedState.Checked);
    // Against the full tree it is only partial.
    expect(engine.getState("docs")).toBe(CheckedState.Indeterminate);
  });

  it("re-applies the active query when minSearchChars changes", () => {
    const engine = new Engine(fileTree, { minSearchChars: 8 });
    engine.setSearchQuery("readme");
    expect(engine.isSearchActive()).toBe(false);
    engine.setMinSearchChars(3);
    expect(engine.isSearchActive()).toBe(true);
    expect(ids(engine)).toEqual(["docs", "readme"]);
  });
});

describe("setData", () => {
  it("preserves selection and expansion across a structural update", () => {
    const engine = new Engine(fileTree);
    engine.setExpanded(["docs", "src"]);
    engine.toggle("readme", true);

    const next: TreeDefinition = {
      ...fileTree,
      __root__: { id: "__root__", label: "root", children: ["docs", "src", "tests"] },
      tests: { id: "tests", label: "tests", children: ["spec"] },
      spec: { id: "spec", label: "engine.test.ts" },
    };
    engine.setData(next);

    expect(engine.getAllChecked()).toEqual(["readme"]);
    expect(engine.getExpanded().sort()).toEqual(["__root__", "docs", "src"]);
    expect(ids(engine)).toContain("tests");
  });

  it("prunes state for nodes that disappeared", () => {
    const engine = new Engine(fileTree);
    engine.toggle("readme", true);
    engine.toggle("engine", true);

    const next: TreeDefinition = {
      __root__: { id: "__root__", label: "root", children: ["src"] },
      src: { id: "src", label: "src", children: ["engine"] },
      engine: { id: "engine", label: "engine.ts" },
    };
    engine.setData(next);
    expect(engine.getAllChecked()).toEqual(["engine"]);
  });

  it("keeps the active query applied to the new structure", () => {
    const engine = new Engine(fileTree);
    engine.setSearchQuery("tree");
    expect(ids(engine)).toEqual(["src", "ui", "tree"]);

    engine.setData({
      ...fileTree,
      ui: { id: "ui", label: "ui", children: ["tree", "row", "extra"] },
      extra: { id: "extra", label: "tree-extra.tsx" },
    });
    expect(ids(engine)).toEqual(["src", "ui", "tree", "extra"]);
  });
});

describe("caching", () => {
  it("does not rebuild the flattened rows on a selection change", () => {
    const engine = new Engine(fileTree, { initialExpanded: ["docs"] });
    const first = engine.getVisibleItems();
    engine.toggle("readme", true);
    // Same array identity: selection moved no rows, so the layout cache holds.
    expect(engine.getVisibleItems()).toBe(first);
  });

  it("does rebuild the flattened rows when expansion changes", () => {
    const engine = new Engine(fileTree);
    const first = engine.getVisibleItems();
    engine.toggleExpanded("docs");
    expect(engine.getVisibleItems()).not.toBe(first);
  });

  it("skips subtrees with no assignments when reading the selection", () => {
    const { data, leafIds } = makeTree({ branching: 8, depth: 5 });
    const engine = new Engine(data);
    expect(engine.getAllChecked()).toEqual([]);
    engine.checkAll();
    expect(engine.getAllChecked()).toHaveLength(leafIds.length);
    engine.uncheckAll();
    expect(engine.getAllChecked()).toEqual([]);
  });
});
