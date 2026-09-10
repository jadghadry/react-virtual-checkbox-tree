import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Playground } from "@/components/demo-play-playground";

export const metadata: Metadata = {
  title: "Playground — react-virtual-checkbox-tree",
  description:
    "Drive the real React checkbox tree at 1k, 10k or 100k nodes. Ten knobs, a generated component that updates as you turn them, and a shareable URL.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <>
      <header className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Playground
          </p>
          <h1 className="max-w-[24ch] text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Ten knobs on the real component.
          </h1>
          <p className="mt-4 max-w-[68ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
            This is the actual component, not a recording. Turn a knob and two things change at
            once: the tree on the left, and the component source underneath it. Copy that source and
            it runs — the imports are there and the data is the canonical eight-node tree used
            throughout{" "}
            <Link className="text-[var(--color-accent)] underline underline-offset-[3px]" href="/docs">
              the docs
            </Link>
            .
          </p>
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[var(--color-faint)]">
            Ten props have knobs —{" "}
            <code className="font-mono text-[var(--color-muted)]">
              data, estimateSize, indent, height, overscan, minSearchChars, searchScope,
              renderCheckbox, renderItem, checkedItems
            </code>{" "}
            — and the filter box above the tree drives{" "}
            <code className="font-mono text-[var(--color-muted)]">searchQuery</code>. There are no
            knobs for{" "}
            <code className="font-mono text-[var(--color-muted)]">
              renderExpander, expandedItems, onExpand, className
            </code>{" "}
            or <code className="font-mono text-[var(--color-muted)]">style</code>;{" "}
            <Link
              className="text-[var(--color-accent)] underline underline-offset-[3px]"
              href="/docs/api/tree"
            >
              the props reference
            </Link>{" "}
            has those.
          </p>
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-[var(--color-faint)]">
            There is no bundler in an iframe here. The knobs write into one state object, and that
            object renders both the tree and the snippet, so the page stays as cheap as the library
            it is arguing for.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense fallback={<PlaygroundSkeleton />}>
          <Playground />
        </Suspense>
      </div>
    </>
  );
}

/**
 * `useSearchParams` forces the boundary below it to render on the client, so
 * Next requires a fallback. It matches the real layout's footprint to keep the
 * page from jumping once the knobs hydrate.
 */
function PlaygroundSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="h-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
      <div className="h-[560px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
    </div>
  );
}
