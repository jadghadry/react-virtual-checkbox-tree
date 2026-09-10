"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { docNeighbours } from "@/lib/docs-nav";

export function DocsFooterNav() {
  const pathname = usePathname();
  const { next, prev } = docNeighbours(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-14 grid gap-3 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          className="rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-surface-2)]"
          href={prev.href}
        >
          <span className="block text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
            Previous
          </span>
          <span className="text-[14px] font-medium">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          className="rounded-lg border border-[var(--color-border)] p-3 text-right transition-colors hover:bg-[var(--color-surface-2)] sm:col-start-2"
          href={next.href}
        >
          <span className="block text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
            Next
          </span>
          <span className="text-[14px] font-medium">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
