import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "@/components/code-block";
import { HeroDemo } from "@/components/hero-demo";
import { InstallStrip } from "@/components/install-strip";
import { LazyMount } from "@/components/lazy-mount";
import { NaiveRace } from "@/components/naive-race";
import { SearchTeleport } from "@/components/search-teleport";
import { Section } from "@/components/section";
import { benchmarks, bundleSize, site } from "@/lib/site";

// Deliberately shorter than site.name + site.tagline, which together run to 82
// characters and get cut off in search results. Every other page on the site is
// already inside the limits; the homepage was the one over.
export const metadata: Metadata = {
  title: "react-virtual-checkbox-tree — React tree for 100,000 nodes",
  description:
    "Headless, virtualized checkbox tree for React. Tri-state parents, ancestor-aware search, full keyboard navigation, and no CSS you didn't write.",
  alternates: { canonical: "/" },
};

const QUICK_START = `import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

const data: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs:     { id: "docs", label: "docs", children: ["readme"] },
  readme:   { id: "readme", label: "README.md" },
  src:      { id: "src", label: "src", children: ["engine"] },
  engine:   { id: "engine", label: "engine.ts" },
};

export default function App() {
  return (
    <Tree
      aria-label="Project files"
      data={data}
      height={320}
      onCheck={(checkedLeafIds) => console.log(checkedLeafIds)}
    />
  );
}`;

const WHY = [
  {
    title: "The checkbox math is the product",
    body: "Parent state is derived, never stored. Checking a folder of 50,000 leaves is one map write — measured at 1–3 µs whether the tree holds a thousand nodes or a million. Indeterminate states stay correct through every cascade.",
  },
  {
    title: "Virtualized from the first commit",
    body: "Rows render through @tanstack/react-virtual. A 200,000-node tree mounts the same handful of DOM elements as a 20-node one, and the counter under the demo above is read straight out of the document.",
  },
  {
    title: "Search that doesn't destroy your selection",
    body: "Filter to 12 matching leaves, check the parent folder, clear the filter: exactly those 12 are checked. Everything you couldn't see is untouched — and clearing the query gives you back the folders you had open.",
  },
  {
    title: "Keyboard and screen readers, properly",
    body: "A real ARIA tree: role=\"tree\", aria-level / setsize / posinset on every row, tri-state aria-checked, arrow keys, Home/End, type-ahead, and aria-activedescendant so virtualization can never eat the focus.",
  },
  {
    title: "No CSS. None.",
    body: "There is no stylesheet to import and no theme to override. Swap in your own checkbox, expander and row body through three render props, and style rows with the data-state / data-level attributes the library already emits.",
  },
  {
    title: "The engine works without React",
    body: "Import react-virtual-checkbox-tree/engine and you get the flattening, tri-state and search filtering as a plain class with subscribe() — no renderer, no virtualizer, server-safe. Build your own UI on top, or drive it from a test.",
  },
];

export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
        type="application/ld+json"
      />

      {/* ---- hero ---- */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <p className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-faint)]">
            <span>Headless</span>
            <Dot />
            <span>React 18 &amp; 19</span>
            <Dot />
            <span>{bundleSize.full} gzipped</span>
            <Dot />
            <span>1 dependency</span>
            <Dot />
            <span>MIT</span>
          </p>

          <h1 className="max-w-[19ch] text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Checkbox trees that don&rsquo;t die at 100,000 nodes.
          </h1>

          <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-[var(--color-muted)]">
            Headless, virtualized, tri-state. Cascade a selection across a million nodes in
            microseconds while the browser holds a few dozen rows. Bring your own checkbox.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[14px] font-medium text-[var(--color-accent-fg)] transition-opacity hover:opacity-90"
              href="/docs/quick-start"
            >
              Get started →
            </Link>
            <Link
              className="rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-[14px] transition-colors hover:bg-[var(--color-surface-2)]"
              href="/playground"
            >
              Open the playground
            </Link>
            <a
              className="px-1 text-[14px] text-[var(--color-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-fg)]"
              href={site.repo}
              rel="noreferrer noopener"
              target="_blank"
            >
              Star on GitHub
            </a>
          </div>

          <div className="mt-7">
            <InstallStrip />
          </div>

          <div className="mt-10">
            <HeroDemo />
            <p className="mt-3 text-[12.5px] text-[var(--color-faint)]">
              Every number above is measured live in your browser. The row count comes from{" "}
              <code className="font-mono">querySelectorAll(&quot;[data-rvct-row]&quot;)</code> on this
              page — open devtools and check it.
            </p>
          </div>
        </div>
      </section>

      {/* ---- quick start ---- */}
      <Section
        eyebrow="Thirty seconds"
        lede="A flat map of nodes and a root entry. That is the whole data model — no nesting, no adapters, no provider to mount."
        title="Paste this in"
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <CodeBlock code={QUICK_START} filename="app.tsx" />
          <div className="space-y-4 text-[14px] leading-relaxed text-[var(--color-muted)]">
            <p>
              <strong className="text-[var(--color-fg)]">Flat, not nested.</strong> Lookups are
              O(1), IDs stay stable across updates, and you can build the map straight from a SQL
              result or a flat API response without recursion.
            </p>
            <p>
              <strong className="text-[var(--color-fg)]">Only leaves are checkable.</strong>{" "}
              <code className="font-mono text-[13px]">onCheck</code> hands you leaf IDs and never
              folder IDs, because a folder is not checked — its state is computed from what is
              under it, every time it renders.
            </p>
            <p>
              <strong className="text-[var(--color-fg)]">Uncontrolled by default.</strong> Add{" "}
              <code className="font-mono text-[13px]">checkedItems</code>,{" "}
              <code className="font-mono text-[13px]">expandedItems</code> or{" "}
              <code className="font-mono text-[13px]">searchQuery</code> to take control of any one
              of them independently.
            </p>
            <p>
              Passing a brand-new <code className="font-mono text-[13px]">data</code> object on
              every render is safe: the structure is swapped in place and the user&rsquo;s selection
              and open folders survive it.
            </p>
          </div>
        </div>
      </Section>

      {/* ---- search teleport ---- */}
      <Section
        eyebrow="The second thing it does"
        id="search"
        lede="Type, and matching nodes surface with their ancestors already unfolded. Check a folder while filtered and only the leaves on screen are affected — hidden ones keep whatever state you left them in. Clear the box and the folders you had open come back."
        title="Search that respects what you can see"
      >
        <LazyMount label="the search demo" minHeight={460}>
          <SearchTeleport />
        </LazyMount>
      </Section>

      {/* ---- why ---- */}
      <Section
        eyebrow="Why this one"
        lede="Every headless tree makes virtualization your homework. Every virtualized tree makes a design system your problem. This ships both, wired together, and stays out of your markup."
        title="What you actually get"
      >
        <div className="grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((item) => (
            <div className="bg-[var(--color-bg)] p-5" key={item.title}>
              <h3 className="mb-2 text-[15px] font-semibold">{item.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- the race ---- */}
      <Section
        eyebrow="Proof, not adjectives"
        id="race"
        lede="The same tree, rendered both ways. Turn virtualization off and the page stalls on your machine, not in a screenshot. Capped well below the hero's node count on purpose — the honest version of this demo shouldn't crash your phone."
        title="Watch it break without virtualization"
      >
        <LazyMount label="the comparison demo" minHeight={440}>
          <NaiveRace />
        </LazyMount>
      </Section>

      {/* ---- benchmarks ---- */}
      <Section
        eyebrow="Measured"
        lede="Median of five runs on Node 26 / Apple Silicon, against the published build. Reproduce with npm run bench — the script is in the repo and these numbers come straight out of it."
        title="Where the time goes"
      >
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left">
                <th className="px-4 py-2.5 font-medium">Nodes</th>
                <th className="px-4 py-2.5 font-medium">Build engine</th>
                <th className="px-4 py-2.5 font-medium">Flatten rows</th>
                <th className="px-4 py-2.5 font-medium">Cascade a check</th>
                <th className="px-4 py-2.5 font-medium">Read selection</th>
                <th className="px-4 py-2.5 font-medium">Search keystroke</th>
              </tr>
            </thead>
            <tbody className="tnum font-mono">
              {benchmarks.map((row) => (
                <tr className="border-b border-[var(--color-border)] last:border-0" key={row.nodes}>
                  <td className="px-4 py-2.5 text-[var(--color-fg)]">{row.nodes}</td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{row.build}</td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{row.flatten}</td>
                  <td className="px-4 py-2.5 text-[var(--color-ok)]">{row.cascade}</td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{row.readSelection}</td>
                  <td className="px-4 py-2.5 text-[var(--color-muted)]">{row.search}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          The column that matters is <strong className="text-[var(--color-ok)]">cascade</strong>: it
          does not grow with the tree, because checking a subtree writes a single assignment instead
          of a boolean per node. The columns that <em>do</em> grow are the honest ones — building the
          engine is linear in node count, and asking for the full list of checked leaf IDs has to
          materialize that list. At a million nodes you should drive the{" "}
          <Link className="text-[var(--color-accent)] underline underline-offset-3" href="/docs/api/engine">
            Engine
          </Link>{" "}
          directly and read the sparse selection instead.
        </p>
      </Section>

      {/* ---- honesty ---- */}
      <Section
        eyebrow="Before you install"
        id="limits"
        lede="I would rather you find this out here than after npm i."
        title="When not to use this"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Limitation title="You need drag-and-drop or inline rename">
            This is a selection control, not a file manager. If you need to reorder nodes,{" "}
            <a
              className="text-[var(--color-accent)] underline underline-offset-3"
              href="https://github.com/brimdata/react-arborist"
              rel="noreferrer noopener"
              target="_blank"
            >
              react-arborist
            </a>{" "}
            is the better tool and I would genuinely rather you used it.
          </Limitation>
          <Limitation title="You need to load children on expand">
            The engine wants the whole map up front. You can rebuild{" "}
            <code className="font-mono text-[13px]">data</code> as pages arrive and state is
            preserved, but there is no first-class async loading yet.
          </Limitation>
          <Limitation title="Your data is a graph, not a tree">
            A node appearing under two parents is modelled as a tree: the last parent wins, and the
            checked state follows that branch. Duplicate shared nodes under distinct IDs first — the
            library warns you in development when it spots this.
          </Limitation>
          <Limitation title="You have a hundred nodes and a deadline">
            If your tree is small and you already have a component library with a tree in it, use
            that. The engineering here starts paying for itself somewhere north of a few thousand
            nodes, or when you need the search-selection semantics.
          </Limitation>
          <Limitation title="You can't tolerate a 0.x API">
            v{site.version}. The prop surface will keep moving before 1.0. Pin the exact version.
          </Limitation>
          <Limitation title="You need checkable folders">
            Folders derive their state and can&rsquo;t hold their own. &ldquo;Grant this whole
            department&rdquo; as a value distinct from &ldquo;all its members&rdquo; is not
            expressible yet — it&rsquo;s on the roadmap.
          </Limitation>
        </div>
      </Section>

      {/* ---- cta ---- */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            Three days into the same search?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-muted)]">
            That&rsquo;s how this got written. If it saves you the week it cost me, a star is the
            only thanks it needs — and an issue is worth more than one.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[14px] font-medium text-[var(--color-accent-fg)] transition-opacity hover:opacity-90"
              href="/docs"
            >
              Read the docs
            </Link>
            <a
              className="rounded-md border border-[var(--color-border-strong)] px-4 py-2 text-[14px] transition-colors hover:bg-[var(--color-surface-2)]"
              href={site.repo}
              rel="noreferrer noopener"
              target="_blank"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function Dot() {
  return <span className="text-[var(--color-border-strong)]">·</span>;
}

function Limitation({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <h3 className="mb-1.5 text-[14px] font-semibold">{title}</h3>
      <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{children}</p>
    </div>
  );
}

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: site.name,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        description: site.description,
        url: site.url,
        softwareVersion: site.version,
        license: "https://opensource.org/licenses/MIT",
        author: { "@type": "Person", name: site.author.name },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "Virtualized rendering for 100,000+ nodes",
          "Tri-state checkboxes with derived indeterminate parents",
          "Headless — bring your own checkbox, expander and row markup",
          "Ancestor-aware search that only toggles visible leaves",
          "Full WAI-ARIA tree keyboard navigation",
          "TypeScript-first with one runtime dependency",
        ],
      },
      {
        "@type": "SoftwareSourceCode",
        name: site.name,
        codeRepository: site.repo,
        programmingLanguage: "TypeScript",
        runtimePlatform: "React",
        license: "https://opensource.org/licenses/MIT",
        author: { "@type": "Person", name: site.author.name },
      },
    ],
  };
}
