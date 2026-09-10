import fs from "node:fs";
import path from "node:path";

import { allDocs } from "@/lib/docs-nav";
import { benchmarks, bundleSize, site } from "@/lib/site";

export const dynamic = "force-static";

const DOCS_DIR = path.join(process.cwd(), "app", "docs");
const RULE = "=".repeat(78);
const THIN_RULE = "-".repeat(78);

// ---------------------------------------------------------------------------
// MDX -> plain text
// ---------------------------------------------------------------------------

/**
 * Splits a document into alternating prose and verbatim segments, where a
 * verbatim segment is a fenced code block or an inline code span.
 *
 * Everything in this file that rewrites text runs on prose segments only. A
 * fenced block is the one place where `<Tree>` and `\{` mean exactly what they
 * say, and mangling a code example is the single worst thing this route could
 * do — the examples are the reason an assistant reads the file at all.
 */
function mapProse(source: string, fn: (chunk: string) => string): string {
  return source
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((segment, index) => (index % 2 === 1 ? segment : fn(segment)))
    .join("");
}

/**
 * The module header of an MDX page: the demo-component imports and the
 * `export const metadata` block that sit above the `# Title`.
 *
 * Returned as a character offset so the multi-line metadata object can be cut
 * out of the header alone. Matching it against the whole document instead would
 * let a page that quotes a `metadata` object inside a code fence — the
 * Installation page does exactly that — swallow everything up to the fence's
 * closing brace.
 */
function bodyOffset(source: string): number {
  const heading = source.search(/^#[ \t]/m);
  const fence = source.search(/^```/m);
  const candidates = [heading, fence].filter((index) => index >= 0);
  return candidates.length > 0 ? Math.min(...candidates) : 0;
}

function stripMdx(source: string): string {
  // Cut the metadata export out of the header only. It is duplicated by the
  // Page/URL header this file writes itself, and its multi-line shape is the
  // one construct here that a naive global regex could run away with.
  const split = bodyOffset(source);
  const header = source
    .slice(0, split)
    .replace(/^export const metadata\s*=\s*\{[\s\S]*?^\};[^\n]*$/m, "");
  const out = header + source.slice(split);

  return mapProse(out, (chunk) =>
    chunk
      // {/* MDX comments */}
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      // The page's own imports of demo components, and any other module-level
      // export. These MUST be stripped in prose only: nearly every code example
      // on this site opens with `import { Tree } from "react-virtual-checkbox-tree";`
      // and ends with `export default function App()`, and deleting those lines
      // from the fences would hand every reader an example that does not run.
      .replace(/^import[^\n]*\n/gm, "")
      .replace(/^export (?:const|default|function)[^\n]*\n/gm, "")
      // <Callout type="note" title="…"> … </Callout>, <Demo />, and multi-line
      // attribute lists. Component names are capitalized by convention, which is
      // what keeps this from eating prose containing a less-than sign.
      .replace(/<\/?[A-Z][\s\S]*?>/g, "")
      // MDX escapes: \{ \} \< \> are literal characters in the rendered page.
      .replace(/\\([{}<>])/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
}

// ---------------------------------------------------------------------------
// Locating pages
// ---------------------------------------------------------------------------

function fileForHref(href: string): string {
  const relative = href === "/docs" ? "" : href.slice("/docs/".length);
  return path.join(DOCS_DIR, relative, "page.mdx");
}

/** Every `page.mdx` under app/docs, so a page missing from `docsNav` still ships. */
function everyDocFile(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...everyDocFile(full));
    else if (entry.name === "page.mdx") out.push(full);
  }
  return out;
}

function hrefForFile(file: string): string {
  const relative = path.relative(DOCS_DIR, path.dirname(file));
  return relative === "" || relative === "." ? "/docs" : `/docs/${relative.split(path.sep).join("/")}`;
}

function readPage(href: string, label: string): null | string {
  let raw: string;
  try {
    raw = fs.readFileSync(fileForHref(href), "utf8");
  } catch {
    return null; // page not written yet — omit it rather than emit a broken stub
  }
  const body = stripMdx(raw);
  if (!body) return null;
  return [THIN_RULE, `Page: ${label}`, `URL: ${site.url}${href}`, THIN_RULE, "", body, ""].join("\n");
}

// ---------------------------------------------------------------------------
// Hand-written sections
// ---------------------------------------------------------------------------

const API_SURFACE = `${RULE}
API SURFACE (condensed reference — v${site.version})
${RULE}

Two entry points:

  import { Tree } from "react-virtual-checkbox-tree";          // React component, ships "use client"
  import { Engine } from "react-virtual-checkbox-tree/engine"; // headless core, no React, server-safe

Both resolve under node10, node16 and bundler resolution, as ESM and as CommonJS.
\`require("react-virtual-checkbox-tree")\` works. Verified with publint and
@arethetypeswrong/cli. Peer dependencies: react and react-dom, ^18 or ^19.
Bundle: ${bundleSize.full} for the component entry, ${bundleSize.engine} for the engine entry,
${bundleSize.withVirtualizer} including @tanstack/react-virtual.

--- <Tree> props ----------------------------------------------------------

  aria-label?: string                        Accessible name. Falls back to aria-labelledby, then "Tree".
  aria-labelledby?: string                   ID of an element labelling the tree.
  checkedItems?: string[] | null             Controlled checked LEAF ids. Folder ids are ignored.
  className?: string                         Class on the scroll container.
  data: TreeDefinition                       Required. Flat map keyed by node id, with a "__root__" entry.
  estimateSize?: number | ((index: number) => number)   Row height. Default 32.
  expandedItems?: string[] | null            Controlled expanded folder ids.
  height?: number | string                   Scroll container height. Default "100%".
  indent?: number                            Pixels of indent per level. Default 20.
  minSearchChars?: number                    Characters before searchQuery takes effect. Default 3.
  onCheck?: (checkedLeafIds: string[]) => void          Fires with every checked LEAF id.
  onExpand?: (expandedFolderIds: string[]) => void      Fires with every expanded folder id.
  overscan?: number                          Rows rendered above and below the viewport. Default 8.
  renderCheckbox?: (props: TreeCheckboxRenderProps) => ReactNode
  renderExpander?: (props: TreeExpanderRenderProps) => ReactNode   Folders only.
  renderItem?: (props: TreeItemRenderProps) => ReactNode           Defaults to item.label.
  searchQuery?: string                       Filters to matches and their ancestors.
  searchScope?: "all" | "leaves"             Default "all" — folder labels match too.
  style?: CSSProperties                      Inline style on the scroll container.

That is the complete list. There is no onLoadChildren, no checkStrictly, no
draggable, no onContextMenu, no multiSelect prop.

--- TreeRef (via ref) -----------------------------------------------------

  collapseAll(): void
  expandAll(): void
  getEngine(): Engine                        Escape hatch to everything below.
  focusId(id: string): void                  Reveals, scrolls to, and keyboard-focuses a node.
  scrollToId(id: string): void               Reveals and scrolls to a node without moving focus.

--- Render prop payloads --------------------------------------------------

renderItem receives an OBJECT, not the item:
  { checkedState, id, isActive, isExpanded, isFolder, item, level }

renderCheckbox receives:
  { a11yProps, checkedState, id, isActive, isExpanded, isFolder, item, level,
    onChange: (nextChecked: boolean) => void }

renderExpander receives:
  { a11yProps, id, isExpanded, isFolder, item, level, onToggle: () => void }

a11yProps is { "aria-hidden": true, tabIndex: -1 } and MUST be spread onto your
custom control. The ROW carries role="treeitem" and aria-checked; a checkbox
that stays in the accessibility tree makes every row announce twice, and one
that stays in the tab order puts hundreds of stops between the tree and the
next control on the page. This is the single most common mistake.

--- Styling contract (data attributes) ------------------------------------

Container:  data-rvct-tree
Row:        data-rvct-row
            data-state="checked" | "unchecked" | "indeterminate"
            data-level="0" | "1" | …
            data-expanded="true" | "false"   (folders only)
            data-leaf                        (present on leaves)
            data-active                      (present on the keyboard-active row)

Stable class names, alongside the attributes:

  rvct-row        The row itself.
  rvct-checkbox   The span wrapping the checkbox, default or custom.
  rvct-label      The span wrapping the row body.
  rvct-expander   The default expander button. Absent when renderExpander is passed.

The library ships no stylesheet. These attributes and class names are the whole
API for styling.

--- ARIA and keyboard -----------------------------------------------------

Container: role="tree", aria-multiselectable, tabIndex=0, aria-activedescendant.
Rows: role="treeitem", aria-level, aria-setsize, aria-posinset, aria-checked
("true" | "false" | "mixed"), aria-expanded on folders.

DOM focus never sits on a row. It stays on the container and moves via
aria-activedescendant, precisely so that virtualization unmounting the active
row cannot destroy the focus.

  ArrowDown / ArrowUp   Next / previous visible row
  ArrowRight            Open a closed folder, then step into it
  ArrowLeft             Close an open folder, else move to the parent
  Home / End            First / last visible row
  Space                 Toggle the checkbox on the active row
  Enter                 Toggle expansion on a folder, the checkbox on a leaf
  *                     Expand every folder
  Ctrl/Cmd+A            Check everything, or clear it if everything is checked
  a-z, 0-9              Type-ahead: jump to the next row whose label starts with
                        what you typed (600 ms buffer)

--- Engine methods (react-virtual-checkbox-tree/engine) -------------------

Structure:  setData, getVisibleItems, indexOf, getParent, getLabel, isFolder,
            getNodeCount, getLeafCount
Expansion:  getExpanded, isExpanded, expandAll, collapseAll, toggleExpanded,
            setExpandedFor, setExpanded, revealNode
Selection:  getViewState, getState, getAllChecked, getCheckedSubtrees,
            setCheckedSubtrees, setChecked, toggle, checkAll, uncheckAll
Search:     getSearchQuery, isSearchActive, getMatchCount, setMinSearchChars,
            setSearchScope, setSearchQuery
Reactivity: subscribe, getStructureVersion, getExpandVersion, getSelectionVersion

Constructor: new Engine(data, { initialExpanded?, minSearchChars?, rootId?, searchScope? })

--- Behaviour worth stating outright --------------------------------------

* Only leaves carry a checked state. Folder state is derived. onCheck returns
  LEAF ids only, never a folder id.
* Selection is stored as a sparse map of explicit assignments, not as a set of
  checked ids. Checking a folder of 50,000 leaves writes one entry.
* Passing a new \`data\` object is safe. The structure is swapped in place through
  engine.setData(), and selection, expansion and the active query survive for
  every node that still exists.
* Search matches every label by default, folder names included, and a matching
  folder carries its whole subtree into the filtered view.
* Clearing the search query restores the expansion state the user had before
  searching.
* While search is active, checking a folder affects only the leaves currently
  visible.
* Search normalizes diacritics: "resume" matches "Résumé".

--- Limitations (explicit non-goals and honest costs) ---------------------

* No drag-and-drop, no inline rename, no context menus. Non-goals, not backlog.
* No lazy or async children loading. There is no onLoadChildren prop. Rebuild
  \`data\` as pages arrive instead; state survives the swap.
* No checkable folders and no checkStrictly mode.
* Graphs are not supported. A node listed under two parents keeps only the last
  parent seen, and a development-mode warning is logged.
* v${site.version}. This is a 0.x API and it will change before 1.0.
* Building the engine is linear in node count: about 115 ms at 111,110 nodes and
  about 2 s at 1,111,110.
* getAllChecked() has to materialize the full list of checked leaves — about
  3.7 ms at 111,110 nodes. Use getCheckedSubtrees() when that is too much.

--- Measured benchmarks (median of 5, Node 26 / Apple Silicon) -------------

Reproduce with \`npm run bench\` in the repository.

  nodes      build engine   flatten rows   cascade a check   read selection   search keystroke
${benchmarks
  .map(
    (row) =>
      `  ${row.nodes.padEnd(10)} ${row.build.padEnd(14)} ${row.flatten.padEnd(14)} ` +
      `${row.cascade.padEnd(17)} ${row.readSelection.padEnd(16)} ${row.search}`
  )
  .join("\n")}
`;

/**
 * Emitted only when `/docs/faq` has not been written yet, so this file always
 * answers the questions people ask before installing — without duplicating the
 * FAQ page when it exists.
 */
const FALLBACK_FAQ = `${THIN_RULE}
Page: FAQ
URL: ${site.url}/docs/faq
${THIN_RULE}

# FAQ

## Does it work with Next.js App Router?

Yes. The \`react-virtual-checkbox-tree\` entry point ships a "use client" banner, so
importing \`Tree\` from a Server Component works without adding your own directive.
The \`react-virtual-checkbox-tree/engine\` entry point has no React in it and runs on
the server.

## Can I check a folder?

Not directly. Folders derive their state from their descendants. Clicking a folder
cascades to its leaves, and \`onCheck\` returns leaf ids only.

## How do I load children on demand?

There is no \`onLoadChildren\` prop. Build a new \`data\` object as your pages arrive and
pass it in — the structure is swapped in place and selection, expansion and search
survive for every node that still exists.

## Does it support drag-and-drop?

No. Drag-and-drop, inline rename and context menus are explicit non-goals.

## Does CommonJS work?

Yes. \`require("react-virtual-checkbox-tree")\` resolves, and node10, node16 and bundler
type resolution are all verified with publint and @arethetypeswrong/cli.
`;

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

function buildLlmsFullTxt(): string {
  const parts: string[] = [];

  parts.push(
    [
      RULE,
      `${site.name} v${site.version} — complete documentation`,
      RULE,
      "",
      `Install:   npm install ${site.name}`,
      `Homepage:  ${site.url}`,
      `Source:    ${site.repo}`,
      `Package:   ${site.npm}`,
      `License:   ${site.license}`,
      `Index:     ${site.url}/llms.txt`,
      "",
      site.description,
      "",
      "It is a headless, virtualized, tri-state checkbox tree for React. Only the rows in " +
        "view are mounted, plus a small overscan margin, so a 100,000-node tree mounts the " +
        "same handful of DOM elements as a 20-node one. " +
        "Selection is stored as a sparse map of explicit assignments rather than a set of " +
        "checked ids, which is why checking a folder of 50,000 leaves costs one write and " +
        "measures at 1-3 microseconds at every tree size benchmarked. Folder checkboxes, " +
        "including the indeterminate state, are derived from their descendants and memoized. " +
        "The component ships no CSS: rows expose data attributes and three render props, and " +
        "the row itself carries the ARIA. There is no drag-and-drop, no lazy children loading " +
        "and no checkable folders — those are non-goals, not omissions.",
      "",
      "This file is generated at build time from the MDX sources behind " +
        `${site.url}/docs. Every page below is reproduced in full, in sidebar order, with ` +
        "its canonical URL. Code blocks are verbatim and complete, including their imports.",
      "",
    ].join("\n")
  );

  parts.push(API_SURFACE);

  const emitted = new Set<string>();
  for (const doc of allDocs) {
    const page = readPage(doc.href, doc.label);
    if (page) {
      emitted.add(doc.href);
      parts.push(page);
    }
  }

  // Anything on disk that never made it into docsNav still ships, rather than
  // being silently invisible to every reader of this file.
  for (const file of everyDocFile(DOCS_DIR)) {
    const href = hrefForFile(file);
    if (emitted.has(href)) continue;
    const page = readPage(href, href);
    if (page) {
      emitted.add(href);
      parts.push(page);
    }
  }

  if (!emitted.has("/docs/faq")) parts.push(FALLBACK_FAQ);

  parts.push(`${RULE}\nEnd of ${site.name} v${site.version} documentation.\n${RULE}\n`);

  return parts.join("\n");
}

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
