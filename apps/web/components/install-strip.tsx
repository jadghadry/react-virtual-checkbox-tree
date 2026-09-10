"use client";

import { useEffect, useState } from "react";

import { CopyButton } from "@/components/copy-button";

const MANAGERS = {
  npm: "npm i react-virtual-checkbox-tree",
  pnpm: "pnpm add react-virtual-checkbox-tree",
  yarn: "yarn add react-virtual-checkbox-tree",
  bun: "bun add react-virtual-checkbox-tree",
} as const;

type Manager = keyof typeof MANAGERS;

export function InstallStrip() {
  const [manager, setManager] = useState<Manager>("npm");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rvct-pm");
      if (saved && saved in MANAGERS) setManager(saved as Manager);
    } catch {
      /* private mode — npm is a fine default */
    }
  }, []);

  const pick = (next: Manager) => {
    setManager(next);
    try {
      localStorage.setItem("rvct-pm", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="inline-flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] sm:w-auto">
      <div className="flex border-b border-[var(--color-border)]" role="tablist">
        {(Object.keys(MANAGERS) as Manager[]).map((key) => (
          <button
            aria-selected={manager === key}
            className={`px-3 py-1.5 font-mono text-[12px] transition-colors ${
              manager === key
                ? "border-b-2 border-[var(--color-accent)] text-[var(--color-fg)]"
                : "border-b-2 border-transparent text-[var(--color-faint)] hover:text-[var(--color-muted)]"
            }`}
            key={key}
            onClick={() => pick(key)}
            role="tab"
            type="button"
          >
            {key}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <code className="flex-1 truncate font-mono text-[13px]">
          <span className="select-none text-[var(--color-faint)]">$ </span>
          {MANAGERS[manager]}
        </code>
        <CopyButton label="Copy install command" text={MANAGERS[manager]} />
      </div>
    </div>
  );
}
