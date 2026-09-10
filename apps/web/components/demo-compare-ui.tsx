import Link from "next/link";

import { comparisons } from "@/lib/docs-nav";

/**
 * Shared furniture for the /compare section.
 *
 * Every comparison page has the same spine — header, verified facts, where we
 * win, where we lose, a verdict — because a comparison whose shape changes per
 * competitor is a comparison you can't trust. Nothing here is interactive; the
 * one client component in this section is `demo-compare-naive-bugs`.
 */

/** The single date every fact on every comparison page was checked against. */
export const VERIFIED_ON = "2026-09-10";

export function CompareHeader({
  eyebrow,
  lede,
  title,
}: {
  eyebrow: string;
  lede: string;
  title: string;
}) {
  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
        <h1 className="max-w-[24ch] text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-[68ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
          {lede}
        </p>
      </div>
    </header>
  );
}

export function CompareBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* .prose-rvct caps itself at 68ch, which is right for docs prose and too
          narrow for the side-by-side code panels on these pages. */}
      <div className="prose-rvct" style={{ maxWidth: "82ch" }}>
        {children}
      </div>
    </div>
  );
}

/** A `<h2>` that carries an anchor id, so the docs TOC and deep links work. */
export function H2({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 className="!mt-12 scroll-mt-24" id={id}>
      {children}
    </h2>
  );
}

export type Fact = {
  /** Short label, e.g. "Weekly downloads". */
  label: string;
  /** Human-readable URL of the thing that proves it. */
  source?: string;
  /** Link text for the source. */
  sourceLabel?: string;
  /** The value. Numbers get `tnum`. */
  value: string;
};

/**
 * The facts table. Every row that makes a checkable claim carries the URL that
 * proves it — a comparison without sources is an opinion with a table in it.
 */
export function FactTable({ facts, title }: { facts: Fact[]; title: string }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--color-border)]">
      <p className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-faint)]">
        {title}
      </p>
      <dl className="divide-y divide-[var(--color-border)]">
        {facts.map((fact) => (
          <div
            className="grid gap-1 px-4 py-2.5 sm:grid-cols-[13rem_1fr] sm:items-baseline"
            key={fact.label}
          >
            <dt className="text-[13px] text-[var(--color-faint)]">{fact.label}</dt>
            <dd className="tnum flex flex-wrap items-baseline gap-x-2 font-mono text-[13px] text-[var(--color-fg)]">
              <span>{fact.value}</span>
              {fact.source && (
                <a
                  className="text-[12px] text-[var(--color-accent)] underline underline-offset-3"
                  href={fact.source}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {fact.sourceLabel ?? "source"}
                </a>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The concession block. Deliberately the most visually prominent panel on the
 * page: if the section where the competitor wins looks like a footnote, the
 * whole comparison reads as marketing.
 */
export function Concede({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className="not-prose my-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      style={{ borderLeftColor: "var(--color-warn)", borderLeftWidth: 2 }}
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-warn)]">
        {title}
      </p>
      <div className="prose-rvct [&>*:last-child]:mb-0" style={{ maxWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

/** The closing "Use X if…" statement. One per page, never hedged. */
export function Verdict({
  children,
  otherLabel,
  otherWhen,
  ourWhen,
}: {
  children?: React.ReactNode;
  otherLabel: string;
  otherWhen: string;
  ourWhen: string;
}) {
  return (
    <div className="not-prose my-8 grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
      <div className="bg-[var(--color-bg)] p-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-faint)]">
          Use {otherLabel} if
        </p>
        <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">{otherWhen}</p>
      </div>
      <div className="bg-[var(--color-bg)] p-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-accent)]">
          Use this one if
        </p>
        <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">{ourWhen}</p>
        {children}
      </div>
    </div>
  );
}

/** Footer shown on every comparison page: corrections invite + sibling links. */
export function CompareFooter({ slug }: { slug: string }) {
  const others = comparisons.filter((entry) => entry.slug !== slug);
  return (
    <div className="not-prose mt-14 border-t border-[var(--color-border)] pt-8">
      <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">
        Every fact on this page was checked on{" "}
        <span className="tnum font-mono text-[var(--color-fg)]">{VERIFIED_ON}</span> and links to its
        source. Numbers move and libraries ship; if something here is out of date or unfair,{" "}
        <a
          className="text-[var(--color-accent)] underline underline-offset-3"
          href="https://github.com/jadghadry/react-virtual-checkbox-tree/issues/new?title=Comparison%20correction"
          rel="noreferrer noopener"
          target="_blank"
        >
          open an issue
        </a>{" "}
        and it gets fixed. Corrections that make a competitor look better are the most welcome kind.
      </p>

      {/* Same card grid the /compare index uses for this list, so the two read as
          one pattern rather than two. */}
      <h2 className="mt-10 text-xl font-semibold tracking-[-0.02em]">Other comparisons</h2>
      <ul className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
        {others.map((entry) => (
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

      <p className="mt-6 text-[13.5px] text-[var(--color-muted)]">
        <Link className="text-[var(--color-accent)] underline underline-offset-3" href="/compare">
          ← Back to the full capability matrix
        </Link>
      </p>
    </div>
  );
}
