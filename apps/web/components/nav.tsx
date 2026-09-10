import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { nav, site } from "@/lib/site";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-medium" href="/">
          <TreeMark />
          <span className="hidden font-mono text-[13px] tracking-tight sm:inline">{site.name}</span>
          <span className="font-mono text-[13px] tracking-tight sm:hidden">rvct</span>
        </Link>
        <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-faint)]">
          v{site.version}
        </span>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              className="rounded-md px-2.5 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <a
            className="grid size-8 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            href={site.repo}
            rel="noreferrer noopener"
            target="_blank"
          >
            <span className="sr-only">GitHub repository</span>
            <svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 16 16" width="15">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function TreeMark() {
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 20 20" width="18">
      <rect height="6" rx="1.2" width="6" x="1.5" y="2" />
      <rect height="6" rx="1.2" width="6" x="12" y="8" />
      <rect height="6" rx="1.2" width="6" x="12" y="15" opacity="0.45" />
      <path d="M4.5 8v4.5a2 2 0 0 0 2 2H12M4.5 8v9a2 2 0 0 0 2 2H12" opacity="0.55" />
      <path d="m3 4.6 1.3 1.3L6.6 3.4" stroke="var(--color-accent)" strokeWidth="1.6" />
    </svg>
  );
}
