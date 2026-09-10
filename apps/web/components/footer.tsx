import Link from "next/link";

import { site } from "@/lib/site";

const columns = [
  {
    title: "Docs",
    links: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/quick-start", label: "Quick start" },
      { href: "/docs/checkbox-semantics", label: "Checkbox semantics" },
      { href: "/docs/accessibility", label: "Accessibility" },
      { href: "/docs/api/tree", label: "API reference" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/playground", label: "Playground" },
      { href: "/examples", label: "Examples" },
      { href: "/compare", label: "Comparisons" },
      { href: "/docs/performance", label: "Benchmarks" },
      { href: "/docs/faq", label: "FAQ" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: site.repo, label: "GitHub" },
      { href: site.npm, label: "npm" },
      { href: `${site.repo}/issues`, label: "Report an issue" },
      { href: `${site.repo}/blob/main/CONTRIBUTING.md`, label: "Contributing" },
      { href: "/llms.txt", label: "llms.txt" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-mono text-[13px]">{site.name}</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[var(--color-muted)]">
            {site.tagline} Built by{" "}
            <a
              className="text-[var(--color-fg)] underline underline-offset-3"
              href={`https://github.com/${site.author.github}`}
              rel="noreferrer noopener"
              target="_blank"
            >
              {site.author.name}
            </a>
            .
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[var(--color-faint)]">
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-5 text-[12px] text-[var(--color-faint)] sm:px-6">
        <p>
          {site.license} licensed. Copyright © {new Date().getFullYear()} {site.author.name}.
        </p>
        <p className="font-mono">Benchmarks re-run per release · npm run bench</p>
      </div>
    </footer>
  );
}
