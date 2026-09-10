/**
 * The docs sidebar, and the source of truth for /sitemap.xml, /llms.txt and the
 * prev/next footer links. Adding a page means adding it here.
 */
export type DocLink = { description: string; href: string; label: string };
export type DocGroup = { items: DocLink[]; title: string };

export const docsNav: DocGroup[] = [
  {
    title: "Getting started",
    items: [
      {
        href: "/docs",
        label: "Introduction",
        description: "What this library is, what it refuses to do, and why it exists.",
      },
      {
        href: "/docs/installation",
        label: "Installation",
        description: "Install, peer dependencies, and framework notes for Next.js, Vite and Remix.",
      },
      {
        href: "/docs/quick-start",
        label: "Quick start",
        description: "A complete working tree in one file.",
      },
    ],
  },
  {
    title: "Core concepts",
    items: [
      {
        href: "/docs/data-model",
        label: "Data model",
        description: "TreeDefinition, the __root__ node, and why the map is flat.",
      },
      {
        href: "/docs/checkbox-semantics",
        label: "Checkbox semantics",
        description: "Tri-state, leaf-only checking, and how cascades are stored sparsely.",
      },
      {
        href: "/docs/controlled-uncontrolled",
        label: "Controlled & uncontrolled",
        description: "Taking control of selection, expansion and search independently.",
      },
      {
        href: "/docs/search",
        label: "Search",
        description: "Ancestor-aware filtering, diacritics, and visible-leaf-only toggling.",
      },
      {
        href: "/docs/virtualization",
        label: "Virtualization",
        description: "Row heights, overscan, scroll containers, and what actually mounts.",
      },
    ],
  },
  {
    title: "Customization",
    items: [
      {
        href: "/docs/rendering",
        label: "Render props",
        description: "renderItem, renderCheckbox and renderExpander.",
      },
      {
        href: "/docs/styling",
        label: "Styling",
        description: "Data attributes, a Tailwind skin, and a shadcn/ui checkbox recipe.",
      },
      {
        href: "/docs/imperative-api",
        label: "Imperative API",
        description: "expandAll, collapseAll, scrollToId, focusId and getEngine.",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        href: "/docs/api/tree",
        label: "<Tree> props",
        description: "Every prop, its default, and its exact semantics.",
      },
      {
        href: "/docs/api/engine",
        label: "Engine",
        description: "The headless core: every method on the class.",
      },
      {
        href: "/docs/api/types",
        label: "Types",
        description: "TreeDefinition, TreeItem, VisibleItem, CheckedState and the render props.",
      },
      {
        href: "/docs/accessibility",
        label: "Accessibility",
        description: "The ARIA tree contract, every keyboard shortcut, and known gaps.",
      },
      {
        href: "/docs/performance",
        label: "Performance",
        description: "Measured numbers, where the time goes, and how to go faster.",
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        href: "/docs/migrating/react-checkbox-tree",
        label: "From react-checkbox-tree",
        description: "A prop-by-prop migration map.",
      },
      {
        href: "/docs/recipes/persist-selection",
        label: "Persist a selection",
        description: "Storing selection sparsely instead of as a list of every leaf.",
      },
      {
        href: "/docs/recipes/async-children",
        label: "Loading data in pages",
        description: "Growing the tree as results arrive without losing state.",
      },
      {
        href: "/docs/faq",
        label: "FAQ",
        description: "The questions people actually ask before installing.",
      },
    ],
  },
];

export const allDocs: DocLink[] = docsNav.flatMap((group) => group.items);

export function docNeighbours(href: string) {
  const index = allDocs.findIndex((doc) => doc.href === href);
  return {
    prev: index > 0 ? allDocs[index - 1] : null,
    next: index >= 0 && index < allDocs.length - 1 ? allDocs[index + 1] : null,
  };
}

export const comparisons = [
  {
    slug: "react-checkbox-tree",
    label: "react-checkbox-tree",
    blurb: "The incumbent. Same mental model, no virtualization path.",
  },
  {
    slug: "react-arborist",
    label: "react-arborist",
    blurb: "Virtualized and excellent, but has no checkboxes.",
  },
  {
    slug: "headless-tree",
    label: "headless-tree",
    blurb: "Same philosophy, wider scope — and virtualization is your job.",
  },
  {
    slug: "mui-x-tree-view",
    label: "MUI X Rich Tree View",
    blurb: "Virtualization is behind the Pro licence.",
  },
  {
    slug: "rc-tree",
    label: "rc-tree / antd Tree",
    blurb: "Genuinely virtualized, if you want an Ant-shaped API.",
  },
  {
    slug: "writing-it-yourself",
    label: "Writing it yourself",
    blurb: "The real competitor. The four bugs you will write.",
  },
] as const;

export const examples = [
  { slug: "file-picker", label: "File picker", blurb: "Select files across nested folders." },
  {
    slug: "permissions-matrix",
    label: "Permissions matrix",
    blurb: "Where the indeterminate state is the product.",
  },
  {
    slug: "shadcn-styled",
    label: "shadcn/ui styled",
    blurb: "Drop in the Radix checkbox and Lucide icons.",
  },
  {
    slug: "faceted-filter",
    label: "Faceted filter",
    blurb: "A deep category tree wired to the URL.",
  },
  {
    slug: "engine-only",
    label: "Engine only",
    blurb: "The headless core with a hand-written renderer.",
  },
  {
    slug: "async-pages",
    label: "Paged loading",
    blurb: "Grow the tree as API pages arrive.",
  },
] as const;
