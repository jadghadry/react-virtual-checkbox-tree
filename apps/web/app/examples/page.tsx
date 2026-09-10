import type { Metadata } from "next";
import Link from "next/link";

import { examples } from "@/lib/docs-nav";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Examples — react-virtual-checkbox-tree",
  description:
    "Six working recipes for the React checkbox tree: file picker, permissions matrix, shadcn/ui styling, faceted filter, headless engine, and paged loading.",
  alternates: { canonical: "/examples" },
};

/** Extra per-example detail the sidebar blurb has no room for. */
const DETAIL: Record<(typeof examples)[number]["slug"], { teaches: string; props: string[] }> = {
  "async-pages": {
    teaches:
      "Grow the data prop as API pages land. Selection, expansion and the active query survive every swap — and there is no onLoadChildren to reach for.",
    props: ["data", "onCheck", "onExpand"],
  },
  "engine-only": {
    teaches:
      "Drop <Tree> entirely. Import the Engine from the /engine entry point, subscribe with useSyncExternalStore, and render the rows yourself.",
    props: ["Engine", "subscribe", "getVisibleItems"],
  },
  "faceted-filter": {
    teaches:
      "A search box over a category tree, selected facets as removable chips, and a debounced write to the URL instead of one push per keystroke.",
    props: ["searchQuery", "minSearchChars", "getEngine"],
  },
  "file-picker": {
    teaches:
      "Per-extension icons and file sizes through renderItem, a running total from item.data, and the empty-directory trap that makes a folder checkable.",
    props: ["renderItem", "expandedItems", "onCheck"],
  },
  "permissions-matrix": {
    teaches:
      "Make indeterminate visually distinct from checked, badge each grant by risk, and serialize leaf grants so the server derives the rest.",
    props: ["renderCheckbox", "renderItem", "estimateSize"],
  },
  "shadcn-styled": {
    teaches:
      "Swap in a Radix checkbox and a Lucide chevron without breaking the ARIA contract, including the indeterminate mapping people get wrong.",
    props: ["renderCheckbox", "renderExpander", "indent"],
  },
};

export default function ExamplesIndex() {
  return (
    <>
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Examples
          </p>
          <h1 className="max-w-[20ch] text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Six recipes, each one running on the page.
          </h1>
          <p className="mt-4 max-w-[64ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
            Every example below is a live component, not a screenshot, and every one ships its
            complete source — imports included — so you can paste it into your app and have it
            work. Each ends with the gotcha that recipe exists to warn you about.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <ul className="grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
          {examples.map((example) => {
            const detail = DETAIL[example.slug];
            return (
              <li className="bg-[var(--color-bg)]" key={example.slug}>
                <Link
                  className="flex h-full flex-col p-5 transition-colors hover:bg-[var(--color-surface)]"
                  href={`/examples/${example.slug}`}
                >
                  <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{example.label}</h2>
                  <p className="mt-1 text-[13px] text-[var(--color-faint)]">{example.blurb}</p>
                  <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                    {detail.teaches}
                  </p>
                  <p className="mt-4 flex flex-wrap gap-1.5">
                    {detail.props.map((prop) => (
                      <code
                        className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-accent)]"
                        key={prop}
                      >
                        {prop}
                      </code>
                    ))}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Looking for the prop-by-prop reference instead?{" "}
          <Link
            className="text-[var(--color-accent)] underline underline-offset-3"
            href="/docs/api/tree"
          >
            &lt;Tree&gt; props
          </Link>{" "}
          lists every prop and its default, and{" "}
          <Link
            className="text-[var(--color-accent)] underline underline-offset-3"
            href="/docs/api/engine"
          >
            Engine
          </Link>{" "}
          documents the headless core. Everything here is written against v{site.version}.
        </p>
      </div>
    </>
  );
}
