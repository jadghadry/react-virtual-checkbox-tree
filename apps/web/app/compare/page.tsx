import type { Metadata } from "next";
import Link from "next/link";

import { VERIFIED_ON } from "@/components/demo-compare-ui";
import { comparisons } from "@/lib/docs-nav";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "React tree library comparison — capability matrix",
  description:
    "Six React tree libraries, nine capabilities, every cell sourced: virtualization, tri-state checkboxes, headless markup, ARIA, drag and drop, size, price.",
  alternates: { canonical: "/compare" },
};

/** Cell values. `partial` always carries a `note` explaining the asterisk. */
type Cell = "no" | "partial" | "yes";

type Caps = {
  aria: Cell;
  async: Cell;
  dnd: Cell;
  free: Cell;
  headless: Cell;
  search: Cell;
  tristate: Cell;
  types: Cell;
  virtual: Cell;
};

type Row = {
  gzip: string;
  gzipNote: string;
  href?: string;
  name: string;
  notes: Partial<Record<keyof Caps, string>>;
  values: Caps;
  weekly: string;
};

const COLUMNS: Array<{ key: keyof Caps; label: string }> = [
  { key: "virtual", label: "Virtualized" },
  { key: "tristate", label: "Tri-state" },
  { key: "headless", label: "Headless" },
  { key: "aria", label: "Keyboard + ARIA" },
  { key: "dnd", label: "Drag & drop" },
  { key: "async", label: "Async loading" },
  { key: "search", label: "Search" },
  { key: "types", label: "TypeScript" },
  { key: "free", label: "Free" },
];

const ROWS: Row[] = [
  {
    name: "react-virtual-checkbox-tree",
    weekly: "8",
    // Every other row is measured with that library's dependencies included, so
    // this one has to be too. Quoting 5.6 kB here — the library on its own —
    // would be comparing against numbers built on different terms.
    gzip: "12.6 kB",
    gzipNote: "5.6 kB for the library itself, plus @tanstack/react-virtual, its one dependency",
    values: {
      aria: "yes",
      async: "no",
      dnd: "no",
      free: "yes",
      headless: "yes",
      search: "yes",
      tristate: "yes",
      types: "yes",
      virtual: "yes",
    },
    notes: {
      async: "There is no onLoadChildren prop. You rebuild `data` and state survives.",
      dnd: "Explicit non-goal. No reordering, no inline rename, no context menu.",
      free: "MIT.",
      tristate: "Folders derive state only — they can never be checked in their own right.",
    },
  },
  {
    name: "react-checkbox-tree",
    href: "/compare/react-checkbox-tree",
    weekly: "61,054",
    gzip: "11.0 kB",
    gzipNote: "Plus a required stylesheet and a Font Awesome icon set by default",
    values: {
      aria: "partial",
      async: "no",
      dnd: "no",
      free: "yes",
      headless: "partial",
      search: "no",
      tristate: "yes",
      types: "yes",
      virtual: "no",
    },
    notes: {
      aria: "Space and Enter toggle a focused node. Arrow-key tree navigation is issue #24, open since 2017.",
      headless: "You can swap icons and class names, but the row markup and CSS are the library's.",
      search: "No filter prop in the props table. You filter the `nodes` array yourself.",
      types: "Ships src/index.d.ts. The source is JavaScript with prop-types.",
      virtual: "Every node renders. Issue #43 has been open since 2017.",
    },
  },
  {
    name: "react-arborist",
    href: "/compare/react-arborist",
    weekly: "433,646",
    gzip: "30.8 kB",
    gzipNote: "Bundles react-dnd, react-window, redux and use-sync-external-store",
    values: {
      aria: "yes",
      async: "partial",
      dnd: "yes",
      free: "yes",
      headless: "partial",
      search: "yes",
      tristate: "no",
      types: "yes",
      virtual: "yes",
    },
    notes: {
      async: "No lazy-children API, but the tree is happy to be handed new data.",
      headless: "You write the node component; the row, drag preview and drop cursor are replaceable.",
      tristate: "No checkboxes at all. Tracking issue #352 is open.",
      virtual: "react-window under the hood, rowHeight prop.",
    },
  },
  {
    name: "headless-tree",
    href: "/compare/headless-tree",
    weekly: "296,920",
    gzip: "13.5 kB",
    gzipNote: "@headless-tree/core 12.3 kB + @headless-tree/react 1.2 kB, zero dependencies",
    values: {
      aria: "yes",
      async: "yes",
      dnd: "yes",
      free: "yes",
      headless: "yes",
      search: "yes",
      tristate: "yes",
      types: "yes",
      virtual: "no",
    },
    notes: {
      dnd: "Pointer and keyboard drag-and-drop, both first class.",
      tristate: "checkboxesFeature with propagateCheckedState.",
      virtual: 'Its own docs: "Virtualization is not a included feature of Headless Tree."',
    },
  },
  {
    name: "MUI X Rich Tree View (community)",
    href: "/compare/mui-x-tree-view",
    weekly: "1,043,769",
    gzip: "21.2 kB",
    gzipNote: "Before @mui/material, @mui/system and Emotion, which are peer dependencies",
    values: {
      aria: "yes",
      async: "no",
      dnd: "no",
      free: "yes",
      headless: "no",
      search: "no",
      tristate: "yes",
      types: "yes",
      virtual: "no",
    },
    notes: {
      async: "Lazy loading is a Pro feature.",
      dnd: "Item reordering is a Pro feature.",
      free: "MIT, but the virtualized variant is not.",
      headless: "It is Material Design. That is the point of it.",
      search: "No filtering prop in the Tree View docs.",
      tristate: "checkboxSelection + selectionPropagation, indeterminate handled automatically.",
      virtual: "Virtualization lives in RichTreeViewPro.",
    },
  },
  {
    name: "MUI X Rich Tree View Pro",
    href: "/compare/mui-x-tree-view",
    weekly: "—",
    gzip: "40.8 kB",
    gzipNote: "@mui/x-tree-view-pro, again before @mui/material and Emotion",
    values: {
      aria: "yes",
      async: "yes",
      dnd: "yes",
      free: "no",
      headless: "no",
      search: "no",
      tristate: "yes",
      types: "yes",
      virtual: "yes",
    },
    notes: {
      free: "$299 per developer per year for MUI X Pro.",
      virtual: "On by default in v9, itemHeight defaults to 32px.",
    },
  },
  {
    name: "rc-tree / antd Tree",
    href: "/compare/rc-tree",
    weekly: "2,223,750",
    gzip: "27.4 kB",
    gzipNote: "rc-tree alone. antd Tree pulls in the whole design system",
    values: {
      aria: "yes",
      async: "yes",
      dnd: "yes",
      free: "yes",
      headless: "no",
      search: "partial",
      tristate: "yes",
      types: "yes",
      virtual: "partial",
    },
    notes: {
      async: "loadData returns a promise and children arrive on expand.",
      headless: "Ant Design markup and class names, or rc-tree's unstyled-but-fixed structure.",
      search: "filterTreeNode marks matching nodes. It does not remove the rest.",
      tristate: "checkable, with checkStrictly to turn the cascade off.",
      virtual: "Only when you pass `height`. Without it NodeList returns the full list.",
    },
  },
];

const SOURCES = [
  {
    label: "npm weekly downloads, 2026-08-31 → 2026-09-06",
    url: "https://api.npmjs.org/downloads/point/last-week/react-arborist",
  },
  { label: "Bundlephobia minified + gzipped", url: "https://bundlephobia.com" },
  {
    label: "react-checkbox-tree #43 — Poor performance when data is huge (open since 2017)",
    url: "https://github.com/jakezatecky/react-checkbox-tree/issues/43",
  },
  {
    label: "react-checkbox-tree #24 — Allow greater keyboard control (open since 2017)",
    url: "https://github.com/jakezatecky/react-checkbox-tree/issues/24",
  },
  {
    label: "react-arborist #352 — Tracking: Checkbox selection & indeterminate state (open)",
    url: "https://github.com/jameskerr/react-arborist/issues/352",
  },
  {
    label: "headless-tree — Virtualization recipe",
    url: "https://headless-tree.lukasbach.com/recipe/virtualization/",
  },
  {
    label: "MUI X — Rich Tree View virtualization (Pro)",
    url: "https://mui.com/x/react-tree-view/rich-tree-view/virtualization/",
  },
  { label: "MUI X pricing", url: "https://mui.com/pricing/" },
  {
    label: "rc-tree NodeList.tsx — `if (virtual === false || !height)`",
    url: "https://github.com/react-component/tree/blob/master/src/NodeList.tsx",
  },
];

export default function CompareIndex() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        type="application/ld+json"
      />

      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Compare
          </p>
          <h1 className="max-w-[26ch] text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            No React tree library ships virtualization, tri-state checkboxes and your own markup in
            one package.
          </h1>
          <p className="mt-4 max-w-[70ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
            That sentence is the entire reason this library exists, and it is the only claim on this
            page that flatters it. The headless libraries hand virtualization back to you.
            The virtualized ones arrive with a design system or a licence key. This one covers that
            gap and loses several columns below doing it — no drag-and-drop, no async children, no
            checkable folders, and eight downloads a week against a competitor&rsquo;s two million.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[1100px] border-collapse text-[13px]">
            <caption className="sr-only">
              Capability matrix for six React tree libraries, last verified {VERIFIED_ON}
            </caption>
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left">
                <th className="sticky left-0 z-10 bg-[var(--color-surface)] px-4 py-2.5 font-medium" scope="col">
                  Library
                </th>
                {COLUMNS.map((column) => (
                  <th className="px-3 py-2.5 text-center font-medium" key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-medium" scope="col">
                  gzip
                </th>
                <th className="px-4 py-2.5 text-right font-medium" scope="col">
                  Weekly
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <tr
                  className={`border-b border-[var(--color-border)] last:border-0 ${
                    index === 0 ? "bg-[color-mix(in_oklch,var(--color-accent)_7%,transparent)]" : ""
                  }`}
                  key={row.name}
                >
                  <th
                    className={`sticky left-0 z-10 px-4 py-2.5 text-left font-medium ${
                      index === 0
                        ? "bg-[color-mix(in_oklch,var(--color-accent)_7%,var(--color-bg))]"
                        : "bg-[var(--color-bg)]"
                    }`}
                    scope="row"
                  >
                    {row.href ? (
                      <Link
                        className="underline decoration-[var(--color-border-strong)] underline-offset-3 hover:decoration-[var(--color-fg)]"
                        href={row.href}
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <span>
                        {row.name}{" "}
                        <span className="font-mono text-[11px] text-[var(--color-faint)]">this one</span>
                      </span>
                    )}
                  </th>
                  {COLUMNS.map((column) => (
                    <td className="px-3 py-2.5 text-center" key={column.key}>
                      <Mark note={row.notes[column.key]} value={row.values[column.key]} />
                    </td>
                  ))}
                  <td
                    className="tnum whitespace-nowrap px-3 py-2.5 text-right font-mono text-[var(--color-muted)]"
                    title={row.gzipNote}
                  >
                    {row.gzip}
                  </td>
                  <td className="tnum whitespace-nowrap px-4 py-2.5 text-right font-mono text-[var(--color-muted)]">
                    {row.weekly}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-faint)]">
          Last verified <span className="tnum font-mono">{VERIFIED_ON}</span>. Hover any half-filled
          cell for the caveat — every one of them has a caveat, including ours. Downloads are the npm
          registry&rsquo;s own numbers for 2026-08-31 → 2026-09-06. Gzip figures are
          Bundlephobia&rsquo;s for the exact published versions, and include each library&rsquo;s
          dependencies — ours too, which is why this table says 12.6 kB where the rest of the site
          says 5.6 kB for the library on its own. Our figure comes from{" "}
          <code className="font-mono">npm run size</code> in the repo, so you can reproduce it rather
          than take it on trust.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">How to read the columns</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Definition term="Virtualized">
              The DOM holds a window of rows, not every node. A tree that renders 100,000 rows is
              not virtualized however fast its diff is.
            </Definition>
            <Definition term="Tri-state">
              A parent whose children are partly checked reads <em>indeterminate</em>, and it stays
              correct at every depth — not just one level up.
            </Definition>
            <Definition term="Headless">
              You supply the markup. Shipping a stylesheet you must import, or a required design
              system, is not headless — it is themeable, which is a different promise.
            </Definition>
            <Definition term="Keyboard + ARIA">
              <code className="font-mono text-[12px]">role=&quot;tree&quot;</code> with arrow keys,
              Home/End, type-ahead and correct{" "}
              <code className="font-mono text-[12px]">aria-checked</code>. Space-to-toggle alone is
              half a mark.
            </Definition>
            <Definition term="Async loading">
              A first-class hook for fetching children when a folder opens. Being able to hand the
              component new data is not the same thing, and it is scored as half.
            </Definition>
            <Definition term="Search">
              A query prop that changes which rows exist. Marking matches without removing
              non-matches is scored as half.
            </Definition>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">The columns this library loses</h2>
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
            Two cells in the first row are empty, and two more losses are not columns at all. None
            of the four are oversights.
          </p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            <Loss title="Drag & drop, rename, context menus">
              Explicit non-goals. This is a selection control, not a file manager.{" "}
              <Link className="text-[var(--color-accent)] underline underline-offset-3" href="/compare/react-arborist">
                react-arborist
              </Link>{" "}
              and{" "}
              <Link className="text-[var(--color-accent)] underline underline-offset-3" href="/compare/headless-tree">
                headless-tree
              </Link>{" "}
              both do this properly and you should use one of them if you need it.
            </Loss>
            <Loss title="Async children">
              There is no <code className="font-mono text-[12px]">onLoadChildren</code> prop. You can
              rebuild <code className="font-mono text-[12px]">data</code> as pages arrive and nothing
              is lost, but that is a workaround, not a feature.
            </Loss>
            <Loss title="Checkable folders">
              Folders derive their state and cannot hold one. &ldquo;Grant the whole
              department&rdquo; as a value distinct from &ldquo;grant every current member&rdquo; is
              not expressible. rc-tree&rsquo;s{" "}
              <code className="font-mono text-[12px]">checkStrictly</code> and
              react-checkbox-tree&rsquo;s <code className="font-mono text-[12px]">checkModel=&quot;all&quot;</code>{" "}
              both give you this today.
            </Loss>
            <Loss title="Install base and maturity">
              v{site.version}, a 0.x API that will move before 1.0, and eight downloads a week.
              rc-tree has 2.2 million. If &ldquo;how many production apps have hit this bug before
              me&rdquo; is your top question, the honest answer here is: almost none.
            </Loss>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Read the long version</h2>
          <ul className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
            {comparisons.map((entry) => (
              <li className="bg-[var(--color-bg)]" key={entry.slug}>
                <Link
                  className="flex h-full flex-col p-5 transition-colors hover:bg-[var(--color-surface)]"
                  href={`/compare/${entry.slug}`}
                >
                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{entry.label}</span>
                  <span className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                    {entry.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Sources</h2>
          <ul className="mt-4 space-y-1.5 text-[13.5px]">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  className="text-[var(--color-accent)] underline underline-offset-3"
                  href={source.url}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[68ch] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            Something wrong, stale, or unfair?{" "}
            <a
              className="text-[var(--color-accent)] underline underline-offset-3"
              href="https://github.com/jadghadry/react-virtual-checkbox-tree/issues/new?title=Comparison%20correction"
              rel="noreferrer noopener"
              target="_blank"
            >
              Open an issue
            </a>{" "}
            and this table changes. Maintainers of the libraries above: corrections from you go in
            first, and a cell that should be green will be made green.
          </p>
        </section>
      </div>
    </>
  );
}

function Mark({ note, value }: { note?: string; value: Cell }) {
  const glyph = value === "yes" ? "●" : value === "partial" ? "◐" : "○";
  const color =
    value === "yes"
      ? "var(--color-ok)"
      : value === "partial"
        ? "var(--color-warn)"
        : "var(--color-faint)";
  const word = value === "yes" ? "Yes" : value === "partial" ? "Partial" : "No";

  return (
    <span
      className={note ? "cursor-help" : undefined}
      style={{ color }}
      title={note ? `${word} — ${note}` : word}
    >
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only">{note ? `${word}. ${note}` : word}</span>
    </span>
  );
}

function Definition({ children, term }: { children: React.ReactNode; term: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <p className="mb-1.5 text-[14px] font-semibold">{term}</p>
      <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{children}</p>
    </div>
  );
}

function Loss({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <li className="rounded-lg border border-[var(--color-border)] p-4">
      <p className="mb-1.5 text-[14px] font-semibold">{title}</p>
      <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{children}</p>
    </li>
  );
}

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: "React tree library comparison — capability matrix",
        description:
          "Six React tree libraries, nine capabilities, every cell sourced: virtualization, tri-state checkboxes, headless markup, ARIA, drag and drop, size, price.",
        url: `${site.url}/compare`,
        datePublished: VERIFIED_ON,
        dateModified: VERIFIED_ON,
        author: { "@type": "Person", name: site.author.name },
        about: ROWS.map((row) => ({ "@type": "SoftwareApplication", name: row.name })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is there a React tree library with both virtualization and tri-state checkboxes built in?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, several — but not together with bring-your-own-markup. antd/rc-tree virtualizes and does tri-state, but hands you Ant Design's markup and only virtualizes when you pass a height. MUI X RichTreeViewPro virtualizes and does tri-state, but costs $299 per developer per year and is Material Design. headless-tree does tri-state and is truly headless, but its docs state that virtualization is not an included feature. react-virtual-checkbox-tree covers all three at the cost of drag-and-drop, async children and checkable folders.",
            },
          },
          {
            "@type": "Question",
            name: "Does react-arborist support checkboxes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not as a built-in feature. react-arborist has multi-selection, but no checkbox column and no indeterminate parent state; issue #352, 'Tracking: Checkbox selection & indeterminate (parent) state', is open. You can render your own checkbox inside a custom node component and derive the cascade yourself.",
            },
          },
          {
            "@type": "Question",
            name: "Is react-checkbox-tree virtualized?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Every node in the tree renders a DOM element. Issue #43, 'Poor performance when data is huge', has been open since July 2017 and virtualization has not shipped in the 2.x line.",
            },
          },
          {
            "@type": "Question",
            name: "Is MUI X Tree View virtualization free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Checkbox selection and selection propagation are in the free community package @mui/x-tree-view, but virtualization lives in RichTreeViewPro from @mui/x-tree-view-pro, which requires an MUI X Pro licence at $299 per developer per year.",
            },
          },
        ],
      },
    ],
  };
}
