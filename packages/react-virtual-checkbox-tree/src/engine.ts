import { CheckedState, ROOT_ID } from "./constants";
import type { SearchScope, TreeDefinition, VisibleItem } from "./types";

export type EngineOptions = {
  /** Folder IDs expanded on construction. The root is always expanded. */
  initialExpanded?: string[];
  /** Minimum query length before search activates. Defaults to `3`. */
  minSearchChars?: number;
  /** ID of the (never-rendered) root node. Defaults to `"__root__"`. */
  rootId?: string;
  /** Which labels search matches. Defaults to `"all"`. */
  searchScope?: SearchScope;
};

/**
 * The headless core: tree flattening, tri-state checkbox math, and search
 * filtering. Has no React dependency — it works in Node, in tests, and behind
 * any renderer.
 *
 * ## How selection is stored
 *
 * Selection is **not** a set of checked IDs. It's a sparse map of explicit
 * *assignments*: checking a folder of 50,000 leaves writes exactly one entry.
 * A node's state is derived by walking up to the nearest ancestor that has an
 * assignment, then memoized until that branch changes. This is why toggling a
 * huge subtree is O(1) rather than O(nodes).
 *
 * @example
 * ```ts
 * import { Engine, CheckedState } from "react-virtual-checkbox-tree/engine";
 *
 * const engine = new Engine(data);
 * engine.subscribe(() => render(engine.getVisibleItems()));
 * engine.toggle("src", true);
 * engine.getViewState("src"); // CheckedState.Checked
 * ```
 */
export class Engine {
  // ---- structure -------------------------------------------------------
  private childrenMap = new Map<string, string[]>();
  private folderSet = new Set<string>();
  private labelMap = new Map<string, string>();
  private leafIds: string[] = [];
  private normalizedLabel = new Map<string, string>();
  private parentMap = new Map<string, null | string>();
  private rootId: string;

  // ---- selection -------------------------------------------------------
  /** Sparse explicit assignments. Absent means "inherit from nearest ancestor". */
  private assignments = new Map<string, boolean>();
  /** Number of assignments inside each subtree (inclusive). Lets us skip whole branches. */
  private assignmentsUnder = new Map<string, number>();
  private allCheckedCache: string[] = [];
  private allCheckedCacheVersion = -1;
  private selectionVersion = 0;
  private stateCache = new Map<string, CheckedState>();
  private stateCacheFiltered = new Map<string, CheckedState>();

  // ---- expansion -------------------------------------------------------
  private expanded = new Set<string>();
  private expandVersion = 0;
  /** Expansion snapshot taken when search activates, restored when it clears. */
  private preSearchExpanded: null | Set<string> = null;

  // ---- view ------------------------------------------------------------
  private flatCacheVersion = -1;
  private flatVisibleItems: VisibleItem[] = [];
  private indexById = new Map<string, number>();
  /** Bumps on anything that changes which rows are visible or in what order. */
  private structureVersion = 0;

  // ---- search ----------------------------------------------------------
  private matchCount = 0;
  private minSearchChars = 3;
  private normalizedQuery = "";
  private searchActive = false;
  private searchQuery = "";
  private searchScope: SearchScope = "all";
  private visibleChildrenMap = new Map<string, string[]>();
  private visibleSet = new Set<string>();

  private observers = new Set<() => void>();

  constructor(data: TreeDefinition, opts?: EngineOptions) {
    this.rootId = opts?.rootId ?? ROOT_ID;
    if (opts?.minSearchChars !== undefined) {
      this.minSearchChars = Math.max(1, opts.minSearchChars);
    }
    if (opts?.searchScope) this.searchScope = opts.searchScope;

    this.build(data);

    if (opts?.initialExpanded) {
      for (const id of opts.initialExpanded) {
        if (this.folderSet.has(id)) this.expanded.add(id);
      }
    }
    if (this.folderSet.has(this.rootId)) this.expanded.add(this.rootId);
  }

  /**
   * Normalizes text for search: strips diacritics and lowercases, so `resume`
   * matches `Résumé`.
   */
  private static normalize(s: string): string {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // =======================================================================
  // Structure
  // =======================================================================

  /**
   * Replaces the tree structure **in place**, preserving selection, expansion,
   * and the active search query.
   *
   * This is what makes passing a new `data` object safe: nodes that still exist
   * keep their checked and expanded state, and nodes that disappeared are
   * pruned. Rebuilding an `Engine` from scratch instead would silently reset
   * everything the user had done.
   */
  setData(data: TreeDefinition) {
    this.build(data);

    // Drop assignments and expansion for nodes that no longer exist.
    for (const id of Array.from(this.assignments.keys())) {
      if (!this.childrenMap.has(id)) this.assignments.delete(id);
    }
    for (const id of Array.from(this.expanded)) {
      if (!this.folderSet.has(id) && id !== this.rootId) this.expanded.delete(id);
    }
    if (this.folderSet.has(this.rootId)) this.expanded.add(this.rootId);
    this.rebuildAssignmentCounts();

    // Re-run the active query against the new structure.
    const q = this.normalizedQuery;
    this.normalizedQuery = "";
    this.applySearch(this.searchQuery, q.length > 0);

    this.stateCache.clear();
    this.stateCacheFiltered.clear();
    this.allCheckedCacheVersion = -1;
    this.selectionVersion++;
    this.bumpStructure();
  }

  private build(data: TreeDefinition) {
    this.childrenMap.clear();
    this.folderSet.clear();
    this.labelMap.clear();
    this.leafIds = [];
    this.normalizedLabel.clear();
    this.parentMap.clear();

    // Pass 1: register every node so we know which IDs actually exist.
    const keys = Object.keys(data);
    for (const key of keys) {
      const item = data[key];
      if (!item) continue;
      this.labelMap.set(key, item.label ?? key);
    }

    // Pass 2: wire children, dropping IDs that have no entry of their own. A
    // dangling reference should not render an undefined row and crash the tree.
    for (const key of keys) {
      const item = data[key];
      if (!item) continue;
      const declared = item.children;
      let children: string[];
      if (!declared || declared.length === 0) {
        children = [];
      } else {
        children = declared.filter((c) => c !== key && this.labelMap.has(c));
        if (process.env.NODE_ENV !== "production" && children.length !== declared.length) {
          const missing = declared.filter((c) => !this.labelMap.has(c));
          if (missing.length > 0) {
            // eslint-disable-next-line no-console
            console.warn(
              `[react-virtual-checkbox-tree] Node "${key}" lists ${missing.length} child ID(s) ` +
                `with no matching entry in \`data\`: ${missing.slice(0, 5).join(", ")}` +
                `${missing.length > 5 ? ", …" : ""}. They have been skipped.`
            );
          }
        }
      }
      this.childrenMap.set(key, children);
      if (children.length > 0) this.folderSet.add(key);
      else this.leafIds.push(key);
    }

    for (const [id, children] of this.childrenMap) {
      for (const child of children) {
        if (process.env.NODE_ENV !== "production" && this.parentMap.has(child)) {
          // eslint-disable-next-line no-console
          console.warn(
            `[react-virtual-checkbox-tree] Node "${child}" is listed as a child of both ` +
              `"${this.parentMap.get(child)}" and "${id}". This engine models a tree, not a ` +
              `graph: only the last parent wins, and the node's checked state will follow ` +
              `that branch. Duplicate shared nodes under distinct IDs instead.`
          );
        }
        this.parentMap.set(child, id);
      }
    }
    if (!this.parentMap.has(this.rootId)) this.parentMap.set(this.rootId, null);

    for (const [id, raw] of this.labelMap) {
      this.normalizedLabel.set(id, Engine.normalize(raw));
    }

    if (process.env.NODE_ENV !== "production") this.assertAcyclic();
  }

  /** Dev-only: a cycle in `children` would hang every traversal. Fail loudly instead. */
  private assertAcyclic() {
    const state = new Map<string, number>(); // 1 = on stack, 2 = done
    for (const start of this.childrenMap.keys()) {
      if (state.get(start)) continue;
      const stack: Array<{ id: string; i: number }> = [{ id: start, i: 0 }];
      state.set(start, 1);
      while (stack.length) {
        const frame = stack[stack.length - 1];
        const children = this.childrenMap.get(frame.id) ?? [];
        if (frame.i >= children.length) {
          state.set(frame.id, 2);
          stack.pop();
          continue;
        }
        const child = children[frame.i++];
        if (!this.childrenMap.has(child)) continue;
        const s = state.get(child);
        if (s === 1) {
          throw new Error(
            `[react-virtual-checkbox-tree] Cycle detected in tree data: "${frame.id}" -> "${child}". ` +
              `Node children must form a tree.`
          );
        }
        if (s === 2) continue;
        state.set(child, 1);
        stack.push({ id: child, i: 0 });
      }
    }
  }

  /** Display label for a node, falling back to its ID. */
  getLabel(id: string): string {
    return this.labelMap.get(id) ?? id;
  }

  /** Whether the node has children (and is therefore not directly checkable). */
  isFolder(id: string): boolean {
    return this.folderSet.has(id);
  }

  /** Total number of nodes, excluding the root. */
  getNodeCount(): number {
    return Math.max(0, this.childrenMap.size - 1);
  }

  /** Total number of leaf (checkable) nodes. */
  getLeafCount(): number {
    return this.leafIds.length;
  }

  // =======================================================================
  // Visible rows
  // =======================================================================

  /**
   * The flattened list of rows to render, honouring expansion and the active
   * search filter. Cached until something changes the shape of the view — a
   * selection change alone does not invalidate it.
   */
  getVisibleItems(): VisibleItem[] {
    if (this.flatCacheVersion === this.structureVersion) return this.flatVisibleItems;

    const out: VisibleItem[] = [];
    this.indexById.clear();

    // Iterative DFS: a deep tree must not blow the call stack.
    const childrenOf = (id: string) =>
      this.searchActive
        ? this.visibleChildrenMap.get(id) ?? []
        : this.childrenMap.get(id) ?? [];

    const rootChildren = childrenOf(this.rootId);
    const stack: Array<{ id: string; level: number; posInSet: number; setSize: number }> = [];
    for (let i = rootChildren.length - 1; i >= 0; i--) {
      stack.push({ id: rootChildren[i], level: 0, posInSet: i + 1, setSize: rootChildren.length });
    }

    while (stack.length) {
      const { id, level, posInSet, setSize } = stack.pop()!;
      const children = childrenOf(id);
      const isFolder = this.searchActive ? children.length > 0 : this.folderSet.has(id);
      const isExpanded = isFolder && this.expanded.has(id);

      this.indexById.set(id, out.length);
      out.push({ id, isExpanded, isFolder, level, posInSet, setSize });

      if (!isExpanded) continue;
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({
          id: children[i],
          level: level + 1,
          posInSet: i + 1,
          setSize: children.length,
        });
      }
    }

    this.flatVisibleItems = out;
    this.flatCacheVersion = this.structureVersion;
    return out;
  }

  /** Row index of a node in {@link getVisibleItems}, or `-1` when it isn't visible. */
  indexOf(id: string): number {
    this.getVisibleItems();
    return this.indexById.get(id) ?? -1;
  }

  /** Bumps on every change that alters which rows are visible. */
  getStructureVersion() {
    return this.structureVersion;
  }

  // =======================================================================
  // Expansion
  // =======================================================================

  /** IDs of every expanded folder, including the root. */
  getExpanded(): string[] {
    return Array.from(this.expanded);
  }

  getExpandVersion() {
    return this.expandVersion;
  }

  isExpanded(id: string) {
    return this.expanded.has(id);
  }

  /** Expands every folder. */
  expandAll() {
    for (const id of this.folderSet) this.expanded.add(id);
    this.bumpExpansion();
  }

  /** Collapses every folder except the root. */
  collapseAll() {
    this.expanded.clear();
    if (this.folderSet.has(this.rootId)) this.expanded.add(this.rootId);
    this.bumpExpansion();
  }

  /** Flips a folder open or closed. No-op on leaves. */
  toggleExpanded(id: string) {
    if (!this.folderSet.has(id)) return;
    if (id === this.rootId) return; // the root is structural and stays open
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.bumpExpansion();
  }

  /** Expands (or collapses) one folder explicitly. */
  setExpandedFor(id: string, expanded: boolean) {
    if (!this.folderSet.has(id)) return;
    if (id === this.rootId) return;
    const has = this.expanded.has(id);
    if (has === expanded) return;
    if (expanded) this.expanded.add(id);
    else this.expanded.delete(id);
    this.bumpExpansion();
  }

  /**
   * Replaces the set of expanded folders.
   *
   * The root is always kept expanded, and it is added *before* the equality
   * check — so a controlled consumer echoing back the value it was handed
   * converges instead of looping forever.
   */
  setExpanded(ids: string[]) {
    const next = new Set(ids);
    if (this.folderSet.has(this.rootId)) next.add(this.rootId);
    if (Engine.setsEqual(next, this.expanded)) return;
    this.expanded = next;
    this.bumpExpansion();
  }

  /** Expands every ancestor of `id` so the node becomes reachable. */
  revealNode(id: string) {
    let changed = false;
    let p = this.parentMap.get(id) ?? null;
    while (p) {
      if (!this.expanded.has(p)) {
        this.expanded.add(p);
        changed = true;
      }
      p = this.parentMap.get(p) ?? null;
    }
    if (changed) this.bumpExpansion();
  }

  /** Parent of a node, or `null` for the root and for unknown IDs. */
  getParent(id: string): null | string {
    return this.parentMap.get(id) ?? null;
  }

  // =======================================================================
  // Selection
  // =======================================================================

  /**
   * The checkbox state to render for a node, honouring the active view.
   *
   * While search is active, a folder summarizes only its **visible** children —
   * a folder showing 2 of its 800 files reads as checked when both visible ones
   * are checked, because that is what the user is looking at.
   */
  getViewState(id: string): CheckedState {
    return this.searchActive ? this.getStateFiltered(id) : this.getStateBase(id);
  }

  /** A node's checkbox state against the full tree, ignoring any search filter. */
  getState(id: string): CheckedState {
    return this.getStateBase(id);
  }

  /**
   * Every checked **leaf** ID. Folders are never included — a folder is not
   * checked, its state is derived.
   *
   * Cached until the selection changes. Unchecked subtrees with no assignments
   * inside them are skipped wholesale, so a sparse selection over a huge tree
   * costs roughly the size of the result, not the size of the tree.
   */
  getAllChecked(): string[] {
    if (this.allCheckedCacheVersion === this.selectionVersion) return this.allCheckedCache;

    const out: string[] = [];
    const stack: Array<{ id: string; inherited: boolean }> = [
      { id: this.rootId, inherited: this.assignments.get(this.rootId) ?? false },
    ];

    while (stack.length) {
      const { id, inherited } = stack.pop()!;
      const children = this.childrenMap.get(id);

      if (!children || children.length === 0) {
        if (id !== this.rootId && inherited) out.push(id);
        continue;
      }

      // No assignments anywhere below: the whole subtree inherits uniformly.
      if ((this.assignmentsUnder.get(id) ?? 0) === 0) {
        if (!inherited) continue; // skip entirely
        this.collectLeaves(id, out);
        continue;
      }

      for (const child of children) {
        const assigned = this.assignments.get(child);
        stack.push({ id: child, inherited: assigned === undefined ? inherited : assigned });
      }
    }

    this.allCheckedCache = out;
    this.allCheckedCacheVersion = this.selectionVersion;
    return out;
  }

  /**
   * The sparse selection: the explicit assignments backing the tree, rather than
   * the expanded list of every checked leaf.
   *
   * Checking a folder of 50,000 leaves produces **one** entry here and 50,000 in
   * {@link getAllChecked}. Persist this if you're operating at a scale where
   * materializing the full list on every change is too expensive.
   */
  getCheckedSubtrees(): Array<{ checked: boolean; id: string }> {
    const out: Array<{ checked: boolean; id: string }> = [];
    for (const [id, checked] of this.assignments) out.push({ checked, id });
    return out;
  }

  /** Restores a selection previously captured with {@link getCheckedSubtrees}. */
  setCheckedSubtrees(entries: Array<{ checked: boolean; id: string }>) {
    this.assignments.clear();
    for (const { checked, id } of entries) {
      if (this.childrenMap.has(id)) this.assignments.set(id, checked);
    }
    this.rebuildAssignmentCounts();
    this.notifySelection();
  }

  getSelectionVersion() {
    return this.selectionVersion;
  }

  /**
   * Replaces the selection with an explicit list of checked leaf IDs.
   *
   * Folder IDs and unknown IDs are ignored. No-ops (and fires nothing) when the
   * resulting selection is identical to the current one.
   *
   * @param silent - Skip bumping the selection version, so controlled consumers
   *   syncing their own value back in don't trigger a change event.
   */
  setChecked(input: string[], silent = false) {
    const next = new Set<string>();
    for (const id of input) {
      if (this.childrenMap.has(id) && !this.folderSet.has(id)) next.add(id);
    }

    const current = new Set(this.getAllChecked());
    if (Engine.setsEqual(next, current)) return;

    this.assignments.clear();
    for (const id of next) this.assignments.set(id, true);
    this.rebuildAssignmentCounts();
    this.notifySelection(silent);
  }

  /**
   * Checks or unchecks a node.
   *
   * Outside search this cascades through the node's entire subtree in a single
   * write. While search is active it affects only the leaves currently visible —
   * filter to 12 matches, check the parent, clear the filter, and exactly those
   * 12 are checked.
   */
  toggle(id: string, checked: boolean) {
    if (!this.childrenMap.has(id)) return;
    if (this.searchActive) this.toggleVisibleOnly(id, checked);
    else this.toggleFull(id, checked);
  }

  /** Checks every leaf in the tree. One write, regardless of size. */
  checkAll() {
    this.toggleFull(this.rootId, true);
  }

  /** Clears the entire selection. */
  uncheckAll() {
    this.assignments.clear();
    this.assignmentsUnder.clear();
    this.notifySelection();
  }

  // =======================================================================
  // Search
  // =======================================================================

  getSearchQuery() {
    return this.searchQuery;
  }

  isSearchActive() {
    return this.searchActive;
  }

  /** How many nodes matched the active query. `0` when search is inactive. */
  getMatchCount() {
    return this.matchCount;
  }

  /** Minimum characters before a query takes effect. */
  setMinSearchChars(n: number) {
    const next = Math.max(1, n);
    if (this.minSearchChars === next) return;
    this.minSearchChars = next;
    const q = this.normalizedQuery;
    this.normalizedQuery = " "; // force applySearch to see a change
    this.applySearch(this.searchQuery, true);
    void q;
    this.bumpStructure();
  }

  /** Whether search matches every label or only leaf labels. */
  setSearchScope(scope: SearchScope) {
    if (this.searchScope === scope) return;
    this.searchScope = scope;
    this.normalizedQuery = " ";
    this.applySearch(this.searchQuery, true);
    this.bumpStructure();
  }

  /**
   * Filters the tree to nodes matching `query` and their ancestors.
   *
   * Activating search snapshots the current expansion and auto-expands every
   * revealed branch; clearing the query **restores** the snapshot, so a user who
   * had ten folders open and typed three characters gets those ten folders back.
   */
  setSearchQuery(query: string) {
    const changed = this.applySearch(query ?? "", false);
    if (changed) this.bumpStructure();
  }

  private applySearch(raw: string, force: boolean): boolean {
    const q = Engine.normalize(raw);
    if (!force && q === this.normalizedQuery) {
      this.searchQuery = raw;
      return false;
    }

    const wasActive = this.searchActive;
    this.searchQuery = raw;
    this.normalizedQuery = q;
    this.searchActive = q.length >= this.minSearchChars;

    this.visibleSet.clear();
    this.visibleChildrenMap.clear();
    this.stateCacheFiltered.clear();
    this.matchCount = 0;

    if (this.searchActive) {
      // Snapshot the user's expansion the first time search turns on.
      if (!wasActive) this.preSearchExpanded = new Set(this.expanded);

      const matches: string[] = [];
      const pool = this.searchScope === "leaves" ? this.leafIds : this.childrenMap.keys();
      for (const id of pool) {
        if (id === this.rootId) continue;
        if ((this.normalizedLabel.get(id) ?? "").includes(q)) matches.push(id);
      }
      this.matchCount = matches.length;

      // Ancestors get auto-expanded so every match is on screen. A *matching*
      // folder stays collapsed — its subtree is reachable, but auto-expanding a
      // folder with 50,000 descendants would defeat the point of filtering.
      const ancestors = new Set<string>([this.rootId]);

      for (const id of matches) {
        this.visibleSet.add(id);
        // A matching folder carries its whole subtree into the filtered view, so
        // checking it selects everything under it — it all matched.
        if (this.folderSet.has(id)) this.collectSubtree(id, this.visibleSet);
        let p = this.parentMap.get(id) ?? null;
        while (p) {
          ancestors.add(p);
          if (this.visibleSet.has(p)) break;
          this.visibleSet.add(p);
          p = this.parentMap.get(p) ?? null;
        }
      }
      this.visibleSet.add(this.rootId);

      for (const id of this.visibleSet) {
        const children = this.childrenMap.get(id);
        if (!children || children.length === 0) continue;
        const restricted = children.filter((c) => this.visibleSet.has(c));
        if (restricted.length > 0) this.visibleChildrenMap.set(id, restricted);
      }

      this.expanded = ancestors;
    } else if (wasActive) {
      this.expanded = this.preSearchExpanded ?? new Set([this.rootId]);
      if (this.folderSet.has(this.rootId)) this.expanded.add(this.rootId);
      this.preSearchExpanded = null;
    }

    this.expandVersion++;
    return true;
  }

  // =======================================================================
  // Observers
  // =======================================================================

  /** Subscribes to any state change. Returns an unsubscribe function. */
  subscribe(cb: () => void) {
    this.observers.add(cb);
    return () => void this.observers.delete(cb);
  }

  // =======================================================================
  // Internals
  // =======================================================================

  private emit() {
    for (const ob of Array.from(this.observers)) ob();
  }

  /** Layout changed: rows moved, appeared, or disappeared. */
  private bumpStructure() {
    this.structureVersion++;
    this.emit();
  }

  private bumpExpansion() {
    this.expandVersion++;
    this.bumpStructure();
  }

  /**
   * Selection changed. Deliberately does **not** touch `structureVersion`: the
   * set of visible rows is identical, so the flattened list stays cached.
   */
  private notifySelection(silent = false) {
    if (!silent) this.selectionVersion++;
    this.stateCache.clear();
    this.stateCacheFiltered.clear();
    this.allCheckedCacheVersion = -1;
    this.emit();
  }

  private static setsEqual(a: Set<string>, b: Set<string>) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  private collectLeaves(root: string, out: string[]) {
    const stack = [root];
    while (stack.length) {
      const id = stack.pop()!;
      const children = this.childrenMap.get(id);
      if (!children || children.length === 0) {
        if (id !== this.rootId) out.push(id);
        continue;
      }
      for (const c of children) stack.push(c);
    }
  }

  private collectSubtree(root: string, out: Set<string>) {
    const stack = [root];
    while (stack.length) {
      const id = stack.pop()!;
      const children = this.childrenMap.get(id);
      if (!children) continue;
      for (const c of children) {
        if (out.has(c)) continue;
        out.add(c);
        stack.push(c);
      }
    }
  }

  private setAssignment(id: string, value: boolean) {
    if (this.assignments.has(id)) {
      this.assignments.set(id, value);
      return;
    }
    this.assignments.set(id, value);
    let cur: null | string = id;
    while (cur) {
      this.assignmentsUnder.set(cur, (this.assignmentsUnder.get(cur) ?? 0) + 1);
      cur = this.parentMap.get(cur) ?? null;
    }
  }

  private deleteAssignment(id: string) {
    if (!this.assignments.delete(id)) return;
    let cur: null | string = id;
    while (cur) {
      const n = (this.assignmentsUnder.get(cur) ?? 1) - 1;
      if (n <= 0) this.assignmentsUnder.delete(cur);
      else this.assignmentsUnder.set(cur, n);
      cur = this.parentMap.get(cur) ?? null;
    }
  }

  private rebuildAssignmentCounts() {
    this.assignmentsUnder.clear();
    for (const id of this.assignments.keys()) {
      let cur: null | string = id;
      while (cur) {
        this.assignmentsUnder.set(cur, (this.assignmentsUnder.get(cur) ?? 0) + 1);
        cur = this.parentMap.get(cur) ?? null;
      }
    }
  }

  /**
   * Drops every assignment strictly below `id`. Subtrees with no assignments in
   * them are skipped in O(1), so this costs the number of assignments cleared,
   * not the size of the subtree.
   */
  private clearSubtreeAssignments(id: string) {
    const stack = [...(this.childrenMap.get(id) ?? [])];
    while (stack.length) {
      const cur = stack.pop()!;
      if ((this.assignmentsUnder.get(cur) ?? 0) === 0) continue;
      this.deleteAssignment(cur);
      const children = this.childrenMap.get(cur);
      if (children) for (const c of children) stack.push(c);
    }
  }

  /** Nearest explicit assignment at or above `id`. */
  private findNearestAssignment(id: string): boolean | undefined {
    let cur: null | string = id;
    while (cur) {
      const a = this.assignments.get(cur);
      if (a !== undefined) return a;
      cur = this.parentMap.get(cur) ?? null;
    }
    return undefined;
  }

  /**
   * Tri-state against the full tree. Iterative post-order so depth can't blow
   * the stack, memoized into `stateCache`.
   */
  private getStateBase(id: string): CheckedState {
    return this.computeState(id, this.stateCache, (n) => this.childrenMap.get(n) ?? []);
  }

  /** Tri-state against only the search-visible children. */
  private getStateFiltered(id: string): CheckedState {
    if (!this.searchActive) return this.getStateBase(id);
    return this.computeState(id, this.stateCacheFiltered, (n) => this.visibleChildrenMap.get(n) ?? []);
  }

  private computeState(
    root: string,
    cache: Map<string, CheckedState>,
    childrenOf: (id: string) => string[]
  ): CheckedState {
    const hit = cache.get(root);
    if (hit !== undefined) return hit;

    const stack: Array<{ id: string; visited: boolean }> = [{ id: root, visited: false }];

    while (stack.length) {
      const frame = stack[stack.length - 1];
      const { id } = frame;

      if (cache.has(id)) {
        stack.pop();
        continue;
      }

      const children = childrenOf(id);

      if (children.length === 0) {
        cache.set(
          id,
          this.findNearestAssignment(id) === true ? CheckedState.Checked : CheckedState.Unchecked
        );
        stack.pop();
        continue;
      }

      // Fast path: nothing below carries an assignment, so the whole subtree is
      // uniform and equal to whatever it inherits.
      if ((this.assignmentsUnder.get(id) ?? 0) === 0) {
        cache.set(
          id,
          this.findNearestAssignment(id) === true ? CheckedState.Checked : CheckedState.Unchecked
        );
        stack.pop();
        continue;
      }

      if (!frame.visited) {
        frame.visited = true;
        for (let i = children.length - 1; i >= 0; i--) {
          if (!cache.has(children[i])) stack.push({ id: children[i], visited: false });
        }
        continue;
      }

      let checked = 0;
      let indeterminate = false;
      for (const c of children) {
        const st = cache.get(c)!;
        if (st === CheckedState.Indeterminate) {
          indeterminate = true;
          break;
        }
        if (st === CheckedState.Checked) checked++;
      }

      cache.set(
        id,
        indeterminate || (checked > 0 && checked < children.length)
          ? CheckedState.Indeterminate
          : checked === 0
            ? CheckedState.Unchecked
            : CheckedState.Checked
      );
      stack.pop();
    }

    return cache.get(root) ?? CheckedState.Unchecked;
  }

  /** Full-tree cascade: one write for the node, then drop stale descendants. */
  private toggleFull(id: string, checked: boolean) {
    this.setAssignment(id, checked);
    this.clearSubtreeAssignments(id);
    this.notifySelection();
  }

  /** Search-scoped cascade: only the leaves the user can currently see. */
  private toggleVisibleOnly(id: string, checked: boolean) {
    if (!this.folderSet.has(id)) {
      this.setAssignment(id, checked);
      this.notifySelection();
      return;
    }

    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      const children = this.visibleChildrenMap.get(cur);
      if (!children || children.length === 0) {
        if (!this.folderSet.has(cur)) this.setAssignment(cur, checked);
        continue;
      }
      for (const c of children) stack.push(c);
    }
    this.notifySelection();
  }
}
