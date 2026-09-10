import Link from "next/link";

import { docsNav } from "@/lib/docs-nav";
import { site } from "@/lib/site";

export const metadata = {
  title: "Page not found — react-virtual-checkbox-tree",
  description:
    "That URL does not exist. Jump to the documentation index, the playground, or open an issue on GitHub.",
  robots: { index: false, follow: true },
};

// The three pages people are usually looking for when they land here, plus the
// two escape hatches. A 404 that only apologizes wastes the visit.
const DESTINATIONS = [
  { href: "/docs", label: "Documentation", blurb: "Every page, from installation to the Engine API." },
  { href: "/playground", label: "Playground", blurb: "Generate 100,000 nodes and drive the real component." },
  { href: "/examples", label: "Examples", blurb: "Six complete, copyable implementations." },
  { href: "/compare", label: "Compare", blurb: "How this differs from the other React tree libraries." },
  {
    href: `${site.repo}/issues`,
    label: "GitHub issues",
    blurb: "A dead link here, or a bug in the library — report either one.",
    external: true,
  },
];

export default function NotFound() {
  const gettingStarted = docsNav[0]?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-faint)]">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-fg)]">
        That page does not exist.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        The URL may have changed while the docs were being restructured, or the link that brought
        you here may be wrong. Everything below still works.
      </p>

      <ul className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {DESTINATIONS.map((destination) => (
          <li key={destination.href}>
            {destination.external ? (
              <a
                className="flex items-baseline gap-3 py-3.5 transition-colors hover:bg-[var(--color-surface)]"
                href={destination.href}
                rel="noreferrer"
                target="_blank"
              >
                <span className="min-w-[9.5rem] font-mono text-[13px] text-[var(--color-accent)]">
                  {destination.label}
                </span>
                <span className="text-[13.5px] text-[var(--color-muted)]">{destination.blurb}</span>
              </a>
            ) : (
              <Link
                className="flex items-baseline gap-3 py-3.5 transition-colors hover:bg-[var(--color-surface)]"
                href={destination.href}
              >
                <span className="min-w-[9.5rem] font-mono text-[13px] text-[var(--color-accent)]">
                  {destination.label}
                </span>
                <span className="text-[13.5px] text-[var(--color-muted)]">{destination.blurb}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      {gettingStarted.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Getting started
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {gettingStarted.map((item) => (
              <li key={item.href}>
                <Link
                  className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-border-strong)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
