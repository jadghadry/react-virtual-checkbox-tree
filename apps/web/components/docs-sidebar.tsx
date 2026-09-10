"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { docsNav } from "@/lib/docs-nav";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-6">
      {docsNav.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--color-faint)]">
            {group.title}
          </p>
          <ul className="space-y-0.5 border-l border-[var(--color-border)]">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`-ml-px block border-l py-1 pl-3 text-[13px] transition-colors ${
                      active
                        ? "border-[var(--color-accent)] font-medium text-[var(--color-fg)]"
                        : "border-transparent text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
                    }`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
