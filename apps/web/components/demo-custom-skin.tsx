"use client";

import { useState } from "react";
import { Tree } from "react-virtual-checkbox-tree";

import { fileTree } from "@/lib/tree-data";

/**
 * The same tree with and without a skin.
 *
 * "Ships no CSS" is easy to say and easy to disbelieve, so the unskinned state
 * is the honest one: inline layout only — position, height, indentation — and
 * nothing else. Everything the skinned state adds comes from the data
 * attributes, using the `.rvct` rules in app/globals.css verbatim.
 */

const INITIALLY_EXPANDED = ["docs", "src", "ui"];

export function DemoCustomSkin() {
  const [skinned, setSkinned] = useState(true);

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2">
        <span className="font-mono text-[11px] text-[var(--color-faint)]">
          {skinned ? ".rvct skin applied" : "no CSS at all"}
        </span>
        <button
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-[12px] text-[var(--color-fg)] transition-colors duration-150 hover:border-[var(--color-border-strong)]"
          onClick={() => setSkinned((value) => !value)}
          type="button"
        >
          {skinned ? "Remove the skin" : "Apply the skin"}
        </button>
      </div>

      <div className={`${skinned ? "rvct font-mono" : ""} px-2 py-1.5`}>
        <Tree
          aria-label="Styling demo file tree"
          data={fileTree}
          estimateSize={28}
          expandedItems={INITIALLY_EXPANDED}
          height={220}
        />
      </div>
    </div>
  );
}
