"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { label?: string; text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      aria-label={copied ? "Copied" : label}
      className="grid size-7 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard blocked — the text is selectable either way */
        }
      }}
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="13">
        {copied ? (
          <path d="m5 12 5 5L20 7" stroke="var(--color-ok)" />
        ) : (
          <>
            <rect height="12" rx="2" width="12" x="9" y="9" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
    </button>
  );
}
