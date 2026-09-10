import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { PermissionsDemo } from "@/components/demo-ex-permissions";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";

export const metadata: Metadata = {
  title: "Permissions matrix — react-virtual-checkbox-tree",
  description:
    "A role editor built on a tri-state checkbox tree: risk badges per grant, an indeterminate state that reads as partial, and leaf-only serialization.",
  alternates: { canonical: "/examples/permissions-matrix" },
};

const SOURCE = `"use client";

import { useState } from "react";
import { CheckedState, Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

const permissions: TreeDefinition = {
  __root__:   { id: "__root__", label: "root", children: ["billing", "users", "content"] },
  billing:    { id: "billing", label: "Billing", children: ["b-read", "b-write", "b-refund"] },
  "b-read":   { id: "b-read", label: "View invoices", data: { risk: "low" } },
  "b-write":  { id: "b-write", label: "Edit invoices", data: { risk: "medium" } },
  "b-refund": { id: "b-refund", label: "Issue refunds", data: { risk: "high" } },
  users:      { id: "users", label: "Users", children: ["u-read", "u-invite", "u-delete"] },
  "u-read":   { id: "u-read", label: "View users", data: { risk: "low" } },
  "u-invite": { id: "u-invite", label: "Invite users", data: { risk: "medium" } },
  "u-delete": { id: "u-delete", label: "Delete users", data: { risk: "high" } },
  content:    { id: "content", label: "Content", children: ["c-read", "c-publish"] },
  "c-read":   { id: "c-read", label: "View drafts", data: { risk: "low" } },
  "c-publish":{ id: "c-publish", label: "Publish", data: { risk: "medium" } },
};

const GROUPS = ["billing", "users", "content"];

export function PermissionsMatrix() {
  const [grants, setGrants] = useState<string[]>([]);

  return (
    <div>
      <Tree
        aria-label="Role permissions"
        data={permissions}
        estimateSize={34}
        expandedItems={GROUPS}
        height={374}
        onCheck={setGrants}
        renderCheckbox={({ a11yProps, checkedState }) => (
          <TriStateBox a11yProps={a11yProps} state={checkedState} />
        )}
        renderItem={({ checkedState, isFolder, item }) => (
          <span style={{ alignItems: "center", display: "flex", gap: 8 }}>
            <span style={{ fontWeight: isFolder ? 500 : 400 }}>{item.label}</span>
            {item.data?.risk === "high" && <Badge>high risk</Badge>}
            {isFolder && checkedState === CheckedState.Indeterminate && (
              <span style={{ color: "#e0a83a", fontSize: 11 }}>partial</span>
            )}
          </span>
        )}
      />

      <button onClick={() => save(grants)} type="button">
        Save {grants.length} grants
      </button>
    </div>
  );
}

async function save(grants: string[]) {
  // Leaf IDs only — the shape onCheck already gives you.
  await fetch("/api/roles/support-agent", {
    body: JSON.stringify({ grants }),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

/**
 * Checked is a filled box with a tick. Indeterminate is a hollow box with a
 * dashed border and a dash. They must not be two shades of the same thing: in a
 * permissions editor, mistaking one for the other grants capabilities nobody
 * approved.
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
      style={{
        alignItems: "center",
        background: checked ? "#4a8cf7" : "transparent",
        border: "1px " + (mixed ? "dashed" : "solid") + " " +
          (checked ? "#4a8cf7" : mixed ? "#e0a83a" : "#555"),
        borderRadius: 4,
        display: "inline-flex",
        height: 15,
        justifyContent: "center",
        width: 15,
      }}
    >
      {checked && <Tick />}
      {mixed && <span style={{ background: "#e0a83a", height: 2, width: 7 }} />}
    </span>
  );
}

function Tick() {
  return (
    <svg fill="none" height="10" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24" width="10">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ border: "1px solid #e0a83a", borderRadius: 999, color: "#e0a83a", fontSize: 10, padding: "1px 6px" }}>
      {children}
    </span>
  );
}`;

const SERVER_SIDE = `// app/api/roles/[slug]/route.ts — derive the folder answer, never store it
import { CheckedState, Engine } from "react-virtual-checkbox-tree/engine";

import { db } from "@/lib/db";
import { permissions } from "@/lib/permissions-tree";

export async function PUT(request: Request) {
  const { grants } = (await request.json()) as { grants: string[] };

  // The engine runs in Node: no React, no virtualizer, no "use client".
  const engine = new Engine(permissions);
  engine.setChecked(grants);

  // Unknown IDs and folder IDs were dropped by setChecked, so this is the
  // validated set — persist it, and compute the tier instead of trusting one.
  const stored = engine.getAllChecked();
  const billingIsWholesale = engine.getState("billing") === CheckedState.Checked;

  await db.role.update({
    data: { grants: stored, tier: billingIsWholesale ? "full" : "scoped" },
    where: { slug: "support-agent" },
  });

  return Response.json({ grants: stored });
}`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="An admin edits what a support agent is allowed to do, across three capability groups. Granting all of Billing and half of Users has to look different at a glance, because approving the wrong one is a security incident rather than a typo."
        title="Permissions matrix"
        why="Permissions are already a hierarchy, and the state a reviewer most needs to see is the one a flat list cannot express: this group is partially granted. The indeterminate parent is not decoration here — it is the only thing distinguishing “everything under Users” from “two of the three things under Users”."
      />

      <ExampleBody>
        <ExampleSection
          lede="Tick one capability inside a group and watch the group's own box: it goes dashed and amber, not blue. Tick all three and it fills in."
          title="The demo"
        >
          <DemoFrame note="The payload underneath is the real value of onCheck, re-rendered on every click.">
            <PermissionsDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="Self-contained, including the tri-state checkbox. Colors are inlined so it does not depend on this site's tokens."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="permissions-matrix.tsx" />
        </ExampleSection>

        <ExampleSection title="Props exercised">
          <PropsExercised
            items={[
              {
                name: "renderCheckbox",
                note: "Receives { a11yProps, checkedState, id, isActive, isExpanded, isFolder, item, level, onChange }. Spread a11yProps or the row is announced twice.",
              },
              {
                name: "checkedState",
                note: 'The CheckedState enum: "checked", "indeterminate" or "unchecked". Compare against CheckedState.Indeterminate rather than a boolean.',
              },
              {
                name: "renderItem",
                note: "Reads item.data.risk to badge each capability. Anything you put in data comes back here untouched.",
              },
              {
                name: "expandedItems",
                note: "A module-level array of the three group IDs, so every capability is visible on load — a permissions editor with collapsed groups hides exactly what needs review.",
              },
              {
                name: "onCheck",
                note: "Leaf grant IDs only. This is the payload; nothing else needs to be serialized.",
              },
              {
                name: "estimateSize",
                note: "34px rows to fit the risk badges without clipping. Row height is a number or a function of the row index.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="Serialize leaf grants; let the server infer the folders" type="warn">
            <p>
              <code>onCheck</code> returns leaf IDs and never folder IDs, because a folder is not
              checked — its state is derived from its descendants on every read. There is no
              checkable-folder mode and no <code>checkStrictly</code> option, so persisting{" "}
              <code>{'{ billing: true }'}</code> is not something the library can round-trip.
            </p>
            <p>
              Store the leaves. When the server needs the folder-level answer — for an audit log,
              or a &ldquo;full billing access&rdquo; tier — rebuild it from the same tree with the{" "}
              <code>/engine</code> entry point, which is React-free and safe to import on the
              server.
            </p>
          </Callout>
          <CodeBlock code={SERVER_SIDE} filename="app/api/roles/[slug]/route.ts" lang="ts" />
        </ExampleSection>

        <ExampleNav
          next={{ href: "/examples/shadcn-styled", label: "shadcn/ui styled" }}
          prev={{ href: "/examples/file-picker", label: "File picker" }}
        />
      </ExampleBody>
    </>
  );
}
