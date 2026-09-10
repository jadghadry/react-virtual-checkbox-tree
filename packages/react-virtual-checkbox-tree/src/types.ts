/**
 * A single node in the tree.
 *
 * Nodes are stored flat, in a {@link TreeDefinition} map keyed by node ID, rather
 * than nested. That keeps lookups O(1), keeps IDs stable across updates, and lets
 * you build a tree straight from a SQL result or a flat API response without
 * recursion.
 */
export type TreeItem = {
  /**
   * IDs of this node's children, in render order.
   *
   * Omit it (or pass an empty array) to make the node a **leaf** — leaves are the
   * only nodes that carry their own checked state. A node with one or more
   * children is a **folder**, and its checkbox state is derived from its
   * descendants.
   */
  children?: string[];
  /**
   * Arbitrary metadata carried through to your renderers untouched. Use it for
   * icons, file sizes, permissions, avatar URLs — anything `renderItem` needs.
   */
  data?: Record<string, unknown>;
  /**
   * Stable identifier for the node. Should match the key this item is stored
   * under in the {@link TreeDefinition} map.
   */
  id: number | string;
  /**
   * Text shown by the default row renderer, and the string matched by search.
   */
  label: string;
};

/**
 * The whole tree, as a flat map of node ID to {@link TreeItem}.
 *
 * The map must contain a root entry — `"__root__"` by default — whose `children`
 * are your top-level rows. The root itself is never rendered.
 *
 * @example
 * ```ts
 * const data: TreeDefinition = {
 *   __root__: { id: "__root__", label: "root", children: ["src"] },
 *   src:      { id: "src", label: "src", children: ["engine"] },
 *   engine:   { id: "engine", label: "engine.ts" },
 * };
 * ```
 */
export type TreeDefinition = Record<string, TreeItem>;

/**
 * A row in the flattened, currently-visible view of the tree.
 *
 * Returned by {@link Engine.getVisibleItems}. One entry per row the user can
 * currently see — collapsed subtrees and search-filtered branches are absent.
 */
export type VisibleItem = {
  /** Node ID. */
  id: string;
  /** Whether this folder is currently expanded. Always `false` for leaves. */
  isExpanded: boolean;
  /** Whether this node has children in the current view. */
  isFolder: boolean;
  /** Depth below the root. Top-level rows are level `0`. */
  level: number;
  /**
   * 1-based index of this node among its visible siblings.
   *
   * Virtualization flattens the DOM, so the nesting a screen reader would
   * normally infer from `role="group"` wrappers isn't there. This becomes
   * `aria-posinset`, which is how the tree stays navigable anyway.
   */
  posInSet: number;
  /** Number of visible siblings at this level. Becomes `aria-setsize`. */
  setSize: number;
};

/**
 * Which labels {@link Engine.setSearchQuery} matches against.
 *
 * - `"all"` (default) — match every node. A matching folder reveals its entire
 *   subtree, which is what people expect from a file-tree filter.
 * - `"leaves"` — match leaf labels only. Folders appear only because they
 *   *contain* a match, never because they *are* one.
 */
export type SearchScope = "all" | "leaves";
