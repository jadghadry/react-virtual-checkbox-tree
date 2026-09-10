import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { CheckedState, DEFAULT_ROW_HEIGHT } from "./constants";
import { Engine } from "./engine";
import type { SearchScope, TreeDefinition, TreeItem } from "./types";

/** Props handed to a custom {@link TreeProps.renderCheckbox}. */
export type TreeCheckboxRenderProps = {
  /**
   * Spread these onto your checkbox. The row itself carries `role="treeitem"`
   * and `aria-checked`, so the visual checkbox must stay out of the tab order
   * and out of the accessibility tree — otherwise every row is announced twice.
   */
  a11yProps: { "aria-hidden": true; tabIndex: -1 };
  /** `"checked" | "unchecked" | "indeterminate"`. */
  checkedState: CheckedState;
  /** Node ID. */
  id: string;
  /** Whether this row is the keyboard-active row. */
  isActive: boolean;
  /** Whether this folder is open. `false` for leaves. */
  isExpanded: boolean;
  /** Whether this node has children. */
  isFolder: boolean;
  /** The underlying tree item, including your `data` blob. */
  item: TreeItem;
  /** Depth below the root; top-level rows are `0`. */
  level: number;
  /** Call with the next checked value. */
  onChange: (nextChecked: boolean) => void;
};

/** Props handed to a custom {@link TreeProps.renderExpander}. Only called for folders. */
export type TreeExpanderRenderProps = {
  /** Spread onto your expander — the row already exposes `aria-expanded`. */
  a11yProps: { "aria-hidden": true; tabIndex: -1 };
  id: string;
  isExpanded: boolean;
  isFolder: boolean;
  item: TreeItem;
  level: number;
  /** Opens or closes the folder. */
  onToggle: () => void;
};

/** Props handed to a custom {@link TreeProps.renderItem}. */
export type TreeItemRenderProps = {
  checkedState: CheckedState;
  id: string;
  isActive: boolean;
  isExpanded: boolean;
  isFolder: boolean;
  item: TreeItem;
  level: number;
};

export type TreeProps = {
  /** Accessible name for the tree. Falls back to `aria-labelledby`, then `"Tree"`. */
  "aria-label"?: string;
  /** ID of an element labelling the tree. */
  "aria-labelledby"?: string;
  /**
   * Controlled list of checked **leaf** IDs. Folder IDs are ignored — a folder is
   * never "checked", its state is derived. Pair with {@link TreeProps.onCheck}.
   */
  checkedItems?: null | string[];
  /** Class applied to the scroll container. */
  className?: string;
  /**
   * The tree, as a flat map keyed by node ID. Must contain a `"__root__"` entry
   * whose `children` are your top-level rows.
   *
   * Passing a new object is safe: the structure is swapped in place and
   * selection, expansion, and the active query are preserved for nodes that
   * still exist.
   */
  data: TreeDefinition;
  /**
   * Row height, or a function returning the height of row `index`.
   * Defaults to `32`.
   */
  estimateSize?: ((index: number) => number) | number;
  /** Controlled list of expanded folder IDs. Pair with {@link TreeProps.onExpand}. */
  expandedItems?: null | string[];
  /** Height of the scroll container. Defaults to `"100%"`. */
  height?: number | string;
  /** Indentation per level, in pixels. Defaults to `20`. */
  indent?: number;
  /** Minimum characters before {@link TreeProps.searchQuery} takes effect. Defaults to `3`. */
  minSearchChars?: number;
  /** Fired with every checked leaf ID whenever the selection changes. */
  onCheck?: (checkedLeafIds: string[]) => void;
  /** Fired with every expanded folder ID whenever expansion changes. */
  onExpand?: (expandedFolderIds: string[]) => void;
  /** Rows rendered outside the viewport, above and below. Defaults to `8`. */
  overscan?: number;
  /** Replaces the default checkbox. */
  renderCheckbox?: (props: TreeCheckboxRenderProps) => ReactNode;
  /** Replaces the default `+`/`−` expander. Called only for folders. */
  renderExpander?: (props: TreeExpanderRenderProps) => ReactNode;
  /** Replaces the row body. Defaults to `item.label`. */
  renderItem?: (props: TreeItemRenderProps) => ReactNode;
  /** Inline style for the scroll container. */
  style?: CSSProperties;
  /** Current search query. Filters to matches and their ancestors. */
  searchQuery?: string;
  /**
   * Whether search matches every label (`"all"`, the default) or only leaf
   * labels (`"leaves"`).
   */
  searchScope?: SearchScope;
};

export type TreeRef = {
  /** Collapses every folder. */
  collapseAll: () => void;
  /** Expands every folder. */
  expandAll: () => void;
  /** The underlying {@link Engine}, for anything the props don't cover. */
  getEngine: () => Engine;
  /** Moves keyboard focus to a node, expanding ancestors and scrolling to it. */
  focusId: (id: string) => void;
  /** Scrolls a node into view, expanding its ancestors first. */
  scrollToId: (id: string) => void;
};

const TYPEAHEAD_TIMEOUT_MS = 600;

/**
 * A headless, virtualized checkbox tree.
 *
 * Renders only the rows in view, so a 200,000-node tree mounts the same handful
 * of DOM elements as a 20-node one. Folder checkboxes are derived from their
 * descendants, including the indeterminate state.
 *
 * @example
 * ```tsx
 * import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";
 *
 * const data: TreeDefinition = {
 *   __root__: { id: "__root__", label: "root", children: ["src"] },
 *   src: { id: "src", label: "src", children: ["engine"] },
 *   engine: { id: "engine", label: "engine.ts" },
 * };
 *
 * export default function App() {
 *   return <Tree data={data} height={320} aria-label="Project files" />;
 * }
 * ```
 */
export const Tree = forwardRef<TreeRef, TreeProps>(function Tree(
  {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    checkedItems,
    className,
    data,
    estimateSize = DEFAULT_ROW_HEIGHT,
    expandedItems,
    height,
    indent = 20,
    minSearchChars = 3,
    onCheck,
    onExpand,
    overscan = 8,
    renderCheckbox,
    renderExpander,
    renderItem,
    searchQuery,
    searchScope = "all",
    style,
  },
  ref
) {
  // One engine for the lifetime of the component. `data` changes are applied to
  // it rather than replacing it, so selection and expansion survive.
  const [engine] = useState(
    () => new Engine(data, { minSearchChars, searchScope })
  );

  // Kept current during render so event handlers created once always reach the
  // live engine.
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const rowDomId = useCallback((id: string) => `${reactId}-${id}`, [reactId]);

  // ---- subscribe -------------------------------------------------------
  const subscribe = useCallback((cb: () => void) => engine.subscribe(cb), [engine]);
  const getSnapshot = useCallback(() => engine.getStructureVersion(), [engine]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // A selection change doesn't move any row, so it's tracked separately: the
  // flattened row list stays cached across every click.
  const getSelectionSnapshot = useCallback(() => engine.getSelectionVersion(), [engine]);
  useSyncExternalStore(subscribe, getSelectionSnapshot, getSelectionSnapshot);

  // ---- upstream events -------------------------------------------------
  const onCheckRef = useRef(onCheck);
  const onExpandRef = useRef(onExpand);
  onCheckRef.current = onCheck;
  onExpandRef.current = onExpand;

  useEffect(() => {
    let prevSelection = engine.getSelectionVersion();
    let prevExpansion = engine.getExpandVersion();
    return engine.subscribe(() => {
      const selection = engine.getSelectionVersion();
      const expansion = engine.getExpandVersion();
      if (selection !== prevSelection) {
        prevSelection = selection;
        onCheckRef.current?.(engine.getAllChecked());
      }
      if (expansion !== prevExpansion) {
        prevExpansion = expansion;
        onExpandRef.current?.(engine.getExpanded());
      }
    });
  }, [engine]);

  // ---- controlled inputs ----------------------------------------------
  const isFirstData = useRef(true);
  useEffect(() => {
    if (isFirstData.current) {
      isFirstData.current = false;
      return; // the constructor already consumed it
    }
    engine.setData(data);
  }, [data, engine]);

  useEffect(() => {
    engine.setMinSearchChars(minSearchChars);
  }, [engine, minSearchChars]);

  useEffect(() => {
    engine.setSearchScope(searchScope);
  }, [engine, searchScope]);

  useEffect(() => {
    if (checkedItems) engine.setChecked(checkedItems, true);
  }, [checkedItems, engine]);

  useEffect(() => {
    if (expandedItems) engine.setExpanded(expandedItems);
  }, [expandedItems, engine]);

  useEffect(() => {
    engine.setSearchQuery(searchQuery ?? "");
  }, [engine, searchQuery]);

  const rows = engine.getVisibleItems();

  // ---- virtualizer -----------------------------------------------------
  const estimateSizeFn = useCallback(
    (index: number) =>
      typeof estimateSize === "function" ? estimateSize(index) : estimateSize,
    [estimateSize]
  );
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const getItemKey = useCallback((index: number) => rowsRef.current[index]?.id ?? index, []);
  const getScrollElement = useCallback(() => scrollRef.current, []);

  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: estimateSizeFn,
    getItemKey,
    getScrollElement,
    overscan,
  });

  // ---- keyboard focus (aria-activedescendant) --------------------------
  // DOM focus stays on the container. Virtualization can unmount the active row
  // at any time, and a row that owns real focus would take the focus with it.
  const [activeId, setActiveId] = useState<null | string>(null);
  const activeIdRef = useRef<null | string>(null);
  activeIdRef.current = activeId;

  const activeIndex = activeId ? engine.indexOf(activeId) : -1;
  const resolvedActiveId = activeIndex >= 0 ? activeId : null;

  const moveTo = useCallback(
    (index: number) => {
      const list = rowsRef.current;
      if (index < 0 || index >= list.length) return;
      const id = list[index].id;
      setActiveId(id);
      virtualizer.scrollToIndex(index, { align: "auto" });
    },
    [virtualizer]
  );

  const typeahead = useRef({ buffer: "", at: 0 });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const eng = engineRef.current;
      const list = rowsRef.current;
      if (list.length === 0) return;

      const current = activeIdRef.current;
      let index = current ? eng.indexOf(current) : -1;
      if (index < 0) index = -1;

      const key = event.key;

      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          moveTo(index < 0 ? 0 : Math.min(index + 1, list.length - 1));
          return;
        case "ArrowUp":
          event.preventDefault();
          moveTo(index < 0 ? list.length - 1 : Math.max(index - 1, 0));
          return;
        case "Home":
          event.preventDefault();
          moveTo(0);
          return;
        case "End":
          event.preventDefault();
          moveTo(list.length - 1);
          return;
        case "ArrowRight": {
          event.preventDefault();
          if (index < 0) return moveTo(0);
          const row = list[index];
          if (!row.isFolder) return;
          if (!row.isExpanded) eng.setExpandedFor(row.id, true);
          else moveTo(index + 1);
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (index < 0) return moveTo(0);
          const row = list[index];
          if (row.isFolder && row.isExpanded) {
            eng.setExpandedFor(row.id, false);
            return;
          }
          const parent = eng.getParent(row.id);
          if (parent) {
            const parentIndex = eng.indexOf(parent);
            if (parentIndex >= 0) moveTo(parentIndex);
          }
          return;
        }
        case " ":
        case "Spacebar": {
          event.preventDefault();
          if (index < 0) return;
          const row = list[index];
          eng.toggle(row.id, eng.getViewState(row.id) !== CheckedState.Checked);
          return;
        }
        case "Enter": {
          event.preventDefault();
          if (index < 0) return;
          const row = list[index];
          if (row.isFolder) eng.toggleExpanded(row.id);
          else eng.toggle(row.id, eng.getViewState(row.id) !== CheckedState.Checked);
          return;
        }
        case "*": {
          event.preventDefault();
          eng.expandAll();
          return;
        }
        default:
          break;
      }

      if (key === "a" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        const all = eng.getAllChecked();
        if (all.length >= eng.getLeafCount()) eng.uncheckAll();
        else eng.checkAll();
        return;
      }

      // Type-ahead: printable characters jump to the next matching row.
      if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const now = typeof performance !== "undefined" ? performance.now() : 0;
        const t = typeahead.current;
        t.buffer = now - t.at > TYPEAHEAD_TIMEOUT_MS ? key : t.buffer + key;
        t.at = now;
        const needle = t.buffer.toLowerCase();
        const start = index < 0 ? 0 : index + (t.buffer.length > 1 ? 0 : 1);
        for (let i = 0; i < list.length; i++) {
          const candidate = list[(start + i) % list.length];
          if (eng.getLabel(candidate.id).toLowerCase().startsWith(needle)) {
            event.preventDefault();
            moveTo(eng.indexOf(candidate.id));
            return;
          }
        }
      }
    },
    [moveTo]
  );

  // ---- stable handlers -------------------------------------------------
  const handleCheck = useCallback((id: string, checked: boolean) => {
    engineRef.current.toggle(id, checked);
    setActiveId(id);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    engineRef.current.toggleExpanded(id);
    setActiveId(id);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      collapseAll: () => engineRef.current.collapseAll(),
      expandAll: () => engineRef.current.expandAll(),
      getEngine: () => engineRef.current,
      focusId: (id: string) => {
        engineRef.current.revealNode(id);
        const index = engineRef.current.indexOf(id);
        if (index >= 0) {
          setActiveId(id);
          virtualizer.scrollToIndex(index, { align: "auto" });
          scrollRef.current?.focus();
        }
      },
      scrollToId: (id: string) => {
        engineRef.current.revealNode(id);
        const index = engineRef.current.indexOf(id);
        if (index >= 0) virtualizer.scrollToIndex(index, { align: "auto" });
      },
    }),
    [virtualizer]
  );

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      aria-activedescendant={resolvedActiveId ? rowDomId(resolvedActiveId) : undefined}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? "Tree")}
      aria-labelledby={ariaLabelledBy}
      aria-multiselectable
      className={className}
      data-rvct-tree=""
      onKeyDown={handleKeyDown}
      ref={scrollRef}
      role="tree"
      style={{
        height: height ?? "100%",
        overflow: "auto",
        position: "relative",
        ...style,
      }}
      tabIndex={0}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          const item = data[row.id];
          if (!item) return null;

          return (
            <TreeRow
              checkedState={engine.getViewState(row.id)}
              domId={rowDomId(row.id)}
              id={row.id}
              indent={indent}
              isActive={resolvedActiveId === row.id}
              isExpanded={row.isExpanded}
              isFolder={row.isFolder}
              item={item}
              key={row.id}
              level={row.level}
              onCheck={handleCheck}
              onToggleExpand={handleToggleExpand}
              posInSet={row.posInSet}
              renderCheckbox={renderCheckbox}
              renderExpander={renderExpander}
              renderItem={renderItem}
              setSize={row.setSize}
              size={virtualRow.size}
              start={virtualRow.start}
            />
          );
        })}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

type TreeRowProps = {
  checkedState: CheckedState;
  domId: string;
  id: string;
  indent: number;
  isActive: boolean;
  isExpanded: boolean;
  isFolder: boolean;
  item: TreeItem;
  level: number;
  onCheck: (id: string, checked: boolean) => void;
  onToggleExpand: (id: string) => void;
  posInSet: number;
  renderCheckbox?: (props: TreeCheckboxRenderProps) => ReactNode;
  renderExpander?: (props: TreeExpanderRenderProps) => ReactNode;
  renderItem?: (props: TreeItemRenderProps) => ReactNode;
  setSize: number;
  size: number;
  start: number;
};

/**
 * `aria-hidden` + `tabIndex: -1`, spread onto the visual checkbox and expander.
 * The row is the interactive element; without this, screen readers announce
 * every row twice and Tab walks through hundreds of controls.
 */
const DECORATIVE = { "aria-hidden": true, tabIndex: -1 } as const;

const TreeRow = memo(function TreeRow({
  checkedState,
  domId,
  id,
  indent,
  isActive,
  isExpanded,
  isFolder,
  item,
  level,
  onCheck,
  onToggleExpand,
  posInSet,
  renderCheckbox,
  renderExpander,
  renderItem,
  setSize,
  size,
  start,
}: TreeRowProps) {
  const toggleExpand = useCallback(() => onToggleExpand(id), [id, onToggleExpand]);
  const change = useCallback(
    (next: boolean) => onCheck(id, next),
    [id, onCheck]
  );

  const handleRowClick = useCallback(() => {
    if (isFolder) onToggleExpand(id);
    else onCheck(id, checkedState !== CheckedState.Checked);
  }, [checkedState, id, isFolder, onCheck, onToggleExpand]);

  const handleCheckboxClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onCheck(id, checkedState !== CheckedState.Checked);
    },
    [checkedState, id, onCheck]
  );

  const shared = { id, isExpanded, isFolder, item, level };

  const expander = isFolder
    ? renderExpander
      ? renderExpander({ ...shared, a11yProps: DECORATIVE, onToggle: toggleExpand })
      : <DefaultExpander a11yProps={DECORATIVE} {...shared} onToggle={toggleExpand} />
    : null;

  const checkbox = renderCheckbox ? (
    renderCheckbox({
      ...shared,
      a11yProps: DECORATIVE,
      checkedState,
      isActive,
      onChange: change,
    })
  ) : (
    <DefaultCheckbox a11yProps={DECORATIVE} checkedState={checkedState} />
  );

  const body = renderItem
    ? renderItem({ ...shared, checkedState, isActive })
    : item.label;

  return (
    <div
      aria-checked={
        checkedState === CheckedState.Indeterminate
          ? "mixed"
          : checkedState === CheckedState.Checked
      }
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-level={level + 1}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      className="rvct-row"
      data-active={isActive ? "" : undefined}
      data-expanded={isFolder ? (isExpanded ? "true" : "false") : undefined}
      data-leaf={isFolder ? undefined : ""}
      data-level={level}
      data-rvct-row=""
      data-state={checkedState}
      id={domId}
      onClick={handleRowClick}
      role="treeitem"
      style={{
        alignItems: "center",
        cursor: "pointer",
        display: "flex",
        gap: 4,
        height: `${size}px`,
        left: 0,
        minWidth: "100%",
        paddingInlineStart: `${level * indent + (isFolder ? 0 : indent)}px`,
        position: "absolute",
        top: 0,
        transform: `translateY(${start}px)`,
        whiteSpace: "nowrap",
        width: "max-content",
      }}
    >
      {expander}
      <span className="rvct-checkbox" onClick={handleCheckboxClick} style={{ display: "inline-flex" }}>
        {checkbox}
      </span>
      <span className="rvct-label">{body}</span>
    </div>
  );
});

function DefaultExpander({
  a11yProps,
  isExpanded,
  onToggle,
}: Pick<TreeExpanderRenderProps, "a11yProps" | "isExpanded" | "onToggle">) {
  return (
    <button
      {...a11yProps}
      className="rvct-expander"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      style={{
        alignItems: "center",
        display: "inline-flex",
        fontSize: 10,
        height: 16,
        justifyContent: "center",
        width: 16,
      }}
      type="button"
    >
      {isExpanded ? "−" : "+"}
    </button>
  );
}

function DefaultCheckbox({
  a11yProps,
  checkedState,
}: Pick<TreeCheckboxRenderProps, "a11yProps" | "checkedState">) {
  return (
    <input
      {...a11yProps}
      checked={checkedState === CheckedState.Checked}
      onChange={() => {
        /* the row owns the interaction */
      }}
      ref={(el) => {
        if (el) el.indeterminate = checkedState === CheckedState.Indeterminate;
      }}
      type="checkbox"
    />
  );
}
