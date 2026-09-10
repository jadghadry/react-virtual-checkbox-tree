# Changelog

All notable changes to `react-virtual-checkbox-tree`. This project follows
[Semantic Versioning](https://semver.org/) — while on `0.x`, minor versions may contain breaking
changes.

## [0.2.0] — 2026-09-10

The first release with tests, CI, and a package that actually installs. If you are on `0.1.0`, upgrade.

### Fixed

- **`require()` was broken in `0.1.0`.** `package.json` declared `main` and `exports.require` as
  `./dist/index.cjs`, but the build emitted `dist/index.js` — so every CommonJS consumer, every Jest
  suite and every CJS-transformed SSR path failed with `MODULE_NOT_FOUND`. The package now sets
  `"type": "module"`, emits both formats under the right names, and CI verifies that every declared
  entry point exists before publishing.
- **Rows could become permanently inert after a `data` update.** Swapping the `data` prop rebuilt the
  `Engine`, while memoized rows kept handlers closed over the discarded one. Clicks on those rows
  silently did nothing and `onCheck` / `onExpand` stopped firing. The engine is now updated in place
  and handlers are stable.
- **A `data` update no longer wipes selection and expansion.** `Engine.setData()` swaps the structure
  and preserves state for every node that still exists, pruning the rest.
- **The default checkbox and expander were redefined on every render**, remounting the DOM input and
  discarding its `indeterminate` property. Both are now module-level components.
- **Clearing a search query no longer collapses your tree.** Expansion is snapshotted when search
  activates and restored when it clears.
- Controlled `expandedItems` could never converge, because the root was injected *after* the equality
  check. Echoing `onExpand`'s value straight back now settles.
- A child ID with no entry in `data` crashed the tree with a `TypeError`. Dangling references are now
  dropped with a development warning.
- Cyclic `children` hung every traversal. Cycles are now detected at build time and throw.
- `setMinSearchChars()` did not re-apply the active query.
- Deep trees could exhaust the call stack. Flattening, state derivation and subtree clearing are all
  iterative now — a 10,000-level chain is covered by a test.

### Added

- **Full keyboard navigation and a valid ARIA tree.** `role="tree"` with `aria-multiselectable` on the
  container; `role="treeitem"` with `aria-level`, `aria-setsize`, `aria-posinset` and tri-state
  `aria-checked` on every row. Arrow keys, `Home`/`End`, `Space`, `Enter`, `*`, `Ctrl`/`Cmd`+`A`, and
  type-ahead. Focus is tracked with `aria-activedescendant` so virtualization unmounting a row cannot
  destroy it.
- `estimateSize` (number or per-row function), `overscan` and `indent` props. Row height is no longer
  hard-coded, and the README no longer tells you to fork the source.
- A `react-virtual-checkbox-tree/engine` entry point: the `Engine` with no React and no virtualizer,
  safe to import from a server component.
- `"use client"` is now shipped on the main entry, so it works in a Next.js App Router server file.
- Search matches every label by default, including folder names; a matching folder carries its whole
  subtree into the filtered view. `searchScope="leaves"` restores the old behavior.
- `Engine.getCheckedSubtrees()` / `setCheckedSubtrees()` — the sparse selection, for persisting a
  selection at a scale where a list of every leaf ID is too expensive.
- `Engine.setData()`, `revealNode()`, `setExpandedFor()`, `getParent()`, `checkAll()`, `uncheckAll()`,
  `getMatchCount()`, `getNodeCount()`, `getLeafCount()`, `getState()`, `setSearchScope()`.
- `TreeRef.focusId()` and `TreeRef.getEngine()`.
- Rows emit `data-rvct-row`, `data-state`, `data-level`, `data-expanded`, `data-leaf` and
  `data-active`; the container emits `data-rvct-tree`. This is now the documented styling contract.
- TSDoc on every public type, so editors show real documentation on hover.
- 51 tests, a benchmark script, and CI across Node 18/20/22/24 gated on `publint` and
  `@arethetypeswrong/cli`.

### Changed

- **Breaking:** `renderItem` now receives a props object —
  `({ checkedState, id, isActive, isExpanded, isFolder, item, level })` — instead of a bare `item`.
  Change `renderItem={(item) => …}` to `renderItem={({ item }) => …}`.
- **Breaking:** `renderCheckbox` and `renderExpander` receive an `a11yProps` object that must be
  spread onto your control. The row owns `role="treeitem"` and `aria-checked`, so a focusable,
  announced checkbox inside it would double up every row.
- **Breaking:** rows use `aria-checked` (`"true"` / `"false"` / `"mixed"`) rather than
  `aria-selected`, which cannot express an indeterminate state.
- Reading the full selection skips subtrees containing no assignments — 3.7 ms instead of ~23 ms at
  100,000 nodes.
- A selection change no longer invalidates the flattened row cache, since no row moved.
- Peer range widened to `react@^18 || ^19`.
- `sideEffects: false`, `engines`, `publishConfig` with provenance, and a much wider `keywords` list.

## [0.1.0] — 2025-12-10

Initial release.

[0.2.0]: https://github.com/jadghadry/react-virtual-checkbox-tree/releases/tag/v0.2.0
[0.1.0]: https://github.com/jadghadry/react-virtual-checkbox-tree/releases/tag/v0.1.0
