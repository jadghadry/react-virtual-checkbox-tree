"use client";

import { useRef, useState } from "react";
import { CheckedState, Tree, type TreeRef } from "react-virtual-checkbox-tree";

import { Metric, MetricBar } from "@/components/metrics";
import { TreeSkin } from "@/components/tree-skin";
import { permissionsTree } from "@/lib/tree-data";

/** Stable identity, so the prop acts as an initial value and not a reset. */
const GROUPS = ["billing", "content", "users"];

const RISK_COLOR: Record<string, string> = {
  high: "var(--color-warn)",
  low: "var(--color-faint)",
  medium: "var(--color-muted)",
};

export function PermissionsDemo() {
  const [grants, setGrants] = useState<string[]>([]);
  const treeRef = useRef<TreeRef>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] p-3">
        <span className="mr-auto font-mono text-[12px] text-[var(--color-faint)]">
          Role: support-agent
        </span>
        <button
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
          onClick={() => treeRef.current?.getEngine().uncheckAll()}
          type="button"
        >
          Revoke all
        </button>
      </div>

      <TreeSkin>
        <Tree
          aria-label="Role permissions"
          data={permissionsTree}
          estimateSize={34}
          expandedItems={GROUPS}
          height={374}
          onCheck={setGrants}
          ref={treeRef}
          renderCheckbox={({ a11yProps, checkedState }) => (
            <TriStateBox a11yProps={a11yProps} state={checkedState} />
          )}
          renderItem={({ checkedState, isFolder, item }) => {
            const risk = item.data?.risk as string | undefined;
            return (
              <span className="flex items-center gap-2">
                <span className={isFolder ? "font-medium" : ""}>{item.label}</span>
                {risk && (
                  <span
                    className="rounded-full border px-1.5 py-px font-mono text-[9.5px] uppercase tracking-wide"
                    style={{ borderColor: RISK_COLOR[risk], color: RISK_COLOR[risk] }}
                  >
                    {risk} risk
                  </span>
                )}
                {isFolder && checkedState === CheckedState.Indeterminate && (
                  <span className="font-mono text-[10.5px] text-[var(--color-warn)]">partial</span>
                )}
              </span>
            );
          }}
        />
      </TreeSkin>

      <MetricBar>
        <Metric label="grants" value={`${grants.length} of 8`} />
        <Metric
          accent={grants.length > 0}
          label="high risk"
          value={String(
            grants.filter((id) => permissionsTree[id]?.data?.risk === "high").length
          )}
        />
      </MetricBar>

      <div className="border-t border-[var(--color-border)] px-4 py-3">
        <p className="mb-1.5 text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
          What gets POSTed
        </p>
        <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-[var(--color-muted)]">
{JSON.stringify({ grants: grants.slice().sort(), role: "support-agent" }, null, 2)}
        </pre>
      </div>
    </>
  );
}

/**
 * Indeterminate must not read as "a bit checked" — in a permissions UI that is
 * the difference between granting three capabilities and granting all eight.
 * Checked is a solid accent tick; indeterminate is a hollow amber dash.
 */
function TriStateBox({
  a11yProps,
  state,
}: {
  a11yProps: { "aria-hidden": true; tabIndex: -1 };
  state: CheckedState;
}) {
  const checked = state === CheckedState.Checked;
  const mixed = state === CheckedState.Indeterminate;
  return (
    <span
      {...a11yProps}
      className="grid size-[15px] shrink-0 place-items-center rounded-[4px] border transition-colors duration-150"
      style={{
        background: checked ? "var(--color-accent)" : "transparent",
        borderColor: checked
          ? "var(--color-accent)"
          : mixed
            ? "var(--color-warn)"
            : "var(--color-border-strong)",
        borderStyle: mixed ? "dashed" : "solid",
      }}
    >
      {checked && (
        <svg
          aria-hidden="true"
          fill="none"
          height="10"
          stroke="var(--color-accent-fg)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          width="10"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {mixed && <span className="block h-[2px] w-[7px] rounded-full bg-[var(--color-warn)]" />}
    </span>
  );
}
