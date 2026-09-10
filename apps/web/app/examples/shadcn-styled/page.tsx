import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { ShadcnStyledDemo } from "@/components/demo-ex-shadcn";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";

export const metadata: Metadata = {
  title: "shadcn/ui checkbox tree — react-virtual-checkbox-tree",
  description:
    "Wire the shadcn/ui Checkbox and Lucide icons into a virtualized tree with renderCheckbox and renderExpander, including the Radix indeterminate mapping.",
  alternates: { canonical: "/examples/shadcn-styled" },
};

const SOURCE = `"use client";

import { ChevronRight, File, Folder } from "lucide-react";
import { CheckedState, Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const files: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs:     { id: "docs", label: "docs", children: ["readme", "guide"] },
  readme:   { id: "readme", label: "README.md" },
  guide:    { id: "guide", label: "guide.md" },
  src:      { id: "src", label: "src", children: ["engine", "ui"] },
  engine:   { id: "engine", label: "engine.ts" },
  ui:       { id: "ui", label: "ui", children: ["tree", "row"] },
  tree:     { id: "tree", label: "tree.tsx" },
  row:      { id: "row", label: "row.tsx" },
};

const INITIAL_EXPANDED = ["docs", "src", "ui"];

export function ShadcnTree() {
  return (
    <div className="rounded-md border bg-background p-2">
      <Tree
        aria-label="Project files"
        data={files}
        estimateSize={32}
        expandedItems={INITIAL_EXPANDED}
        height={288}
        indent={16}
        renderCheckbox={({ a11yProps, checkedState, onChange }) => (
          <Checkbox
            {...a11yProps}
            // Radix wants true | false | "indeterminate" — the library's enum is
            // "checked" | "unchecked" | "indeterminate". Map it, don't cast it.
            checked={
              checkedState === CheckedState.Indeterminate
                ? "indeterminate"
                : checkedState === CheckedState.Checked
            }
            className="size-4"
            onCheckedChange={(next) => onChange(next === true)}
          />
        )}
        renderExpander={({ a11yProps, isExpanded, onToggle }) => (
          <ChevronRight
            {...a11yProps}
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          />
        )}
        renderItem={({ isFolder, item }) => (
          <span className="flex items-center gap-2 text-sm">
            {isFolder ? (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <File className="size-4 shrink-0 text-muted-foreground/70" />
            )}
            <span>{item.label}</span>
          </span>
        )}
      />
    </div>
  );
}`;

const CSS = `/* globals.css — the rows carry the state, so the selectors are CSS, not props. */

[data-rvct-row] {
  border-radius: calc(var(--radius) - 2px);
  padding-right: 0.5rem;
}

[data-rvct-row]:hover {
  background: hsl(var(--accent));
}

/* aria-activedescendant means the active row never holds DOM focus —
   :focus-visible will never match it. Style [data-active] instead. */
[data-rvct-row][data-active] {
  background: hsl(var(--accent));
  box-shadow: inset 0 0 0 1px hsl(var(--ring));
}

[data-rvct-row][data-state="indeterminate"] .rvct-label {
  color: hsl(var(--muted-foreground));
}

[data-rvct-row][data-leaf] {
  font-weight: 400;
}`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="You already have shadcn/ui in the project and the tree has to look like everything else in it — same checkbox, same chevron, same radius, same focus ring. The library ships no CSS, so nothing has to be overridden — you hand your own controls in."
        title="shadcn/ui styled"
        why="A tree is the control here because the data is nested, but the visual language should stay yours. Three render props replace the checkbox, the expander and the row body, and the row markup with its ARIA stays the library's problem."
      />

      <ExampleBody>
        <ExampleSection
          lede={
            'This page has no shadcn/ui installed. The checkbox below is hand-written to the exact shape Radix renders — a square carrying data-state="checked" | "indeterminate" | "unchecked" — so the code in the next section is a drop-in swap.'
          }
          title="The demo"
        >
          <DemoFrame note="Tick one file inside ui/ to see the indeterminate dash the real Radix checkbox renders in the same slot.">
            <ShadcnStyledDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="What it looks like with the actual shadcn/ui Checkbox and lucide-react icons installed."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="shadcn-tree.tsx" />
        </ExampleSection>

        <ExampleSection
          lede="Rows emit data-rvct-row, data-state, data-level, data-expanded, data-leaf and data-active; the container emits data-rvct-tree. That is the styling contract, and it does not change between versions without a note."
          title="The CSS"
        >
          <CodeBlock code={CSS} filename="globals.css" lang="css" />
        </ExampleSection>

        <ExampleSection title="Props exercised">
          <PropsExercised
            items={[
              {
                name: "renderCheckbox",
                note: "Replaces the default input. Gets a11yProps, checkedState, onChange, and the same row context every render prop gets.",
              },
              {
                name: "renderExpander",
                note: "Called for folders only. Gets a11yProps, isExpanded and onToggle — stop propagation in your onClick or the row's own handler toggles it back.",
              },
              {
                name: "renderItem",
                note: "The row body. Returns content, not a row: the treeitem element, its ARIA and its absolute positioning are the library's.",
              },
              {
                name: "indent",
                note: "Pixels of padding per level. Defaults to 20; 16 matches shadcn's tighter spacing scale.",
              },
              {
                name: "className / style",
                note: "Applied to the scroll container, which is also the element carrying role=\"tree\" and data-rvct-tree.",
              },
              {
                name: "estimateSize",
                note: "32 by default, which already matches a size-4 checkbox with text-sm rows.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="Spread a11yProps, and map indeterminate rather than casting it" type="warn">
            <p>
              Both render props receive an <code>a11yProps</code> object —{" "}
              <code>{'{ "aria-hidden": true, tabIndex: -1 }'}</code> — and it must be spread onto
              your control. The <strong>row</strong> is the interactive element: it carries{" "}
              <code>role=&quot;treeitem&quot;</code> and <code>aria-checked</code>. A custom
              checkbox that stays visible to assistive tech makes every row announce twice, and a
              custom checkbox left in the tab order puts one Tab stop per row in a tree that may
              hold thousands.
            </p>
            <p>
              The second half is the type mismatch. Radix&rsquo;s <code>checked</code> takes{" "}
              <code>true | false | &quot;indeterminate&quot;</code>; this library&rsquo;s{" "}
              <code>checkedState</code> is the string enum{" "}
              <code>&quot;checked&quot; | &quot;unchecked&quot; | &quot;indeterminate&quot;</code>.
              They overlap on one value out of three. Writing{" "}
              <code>checked=&#123;checkedState as never&#125;</code> compiles and then renders every
              unchecked box as ticked, because <code>&quot;unchecked&quot;</code> is a truthy
              string.
            </p>
            <p>
              And take the value from <code>onCheckedChange</code> seriously: it can be{" "}
              <code>&quot;indeterminate&quot;</code> too, so compare with{" "}
              <code>next === true</code> rather than passing it straight through.
            </p>
          </Callout>
        </ExampleSection>

        <ExampleNav
          next={{ href: "/examples/faceted-filter", label: "Faceted filter" }}
          prev={{ href: "/examples/permissions-matrix", label: "Permissions matrix" }}
        />
      </ExampleBody>
    </>
  );
}
