import type { Metadata } from "next";

import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { FilePickerDemo } from "@/components/demo-ex-file-picker";
import {
  DemoFrame,
  ExampleBody,
  ExampleHeader,
  ExampleNav,
  ExampleSection,
  PropsExercised,
} from "@/components/demo-ex-shell";

export const metadata: Metadata = {
  title: "File picker example — react-virtual-checkbox-tree",
  description:
    "A working React file picker with nested folders, per-extension icons through renderItem, a live size total from item.data, and the empty-directory trap.",
  alternates: { canonical: "/examples/file-picker" },
};

const SOURCE = `"use client";

import { useMemo, useState } from "react";
import { Tree, type TreeDefinition } from "react-virtual-checkbox-tree";

const files: TreeDefinition = {
  __root__: { id: "__root__", label: "root", children: ["docs", "src"] },
  docs:     { id: "docs", label: "docs", children: ["readme", "guide"] },
  readme:   { id: "readme", label: "README.md", data: { size: 4812 } },
  guide:    { id: "guide", label: "guide.md", data: { size: 18204 } },
  src:      { id: "src", label: "src", children: ["engine", "ui"] },
  engine:   { id: "engine", label: "engine.ts", data: { size: 31907 } },
  ui:       { id: "ui", label: "ui", children: ["tree", "row"] },
  tree:     { id: "tree", label: "tree.tsx", data: { size: 22140 } },
  row:      { id: "row", label: "row.tsx", data: { size: 6755 } },
};

// Declared once, outside the component. \`expandedItems\` is applied whenever the
// array's identity changes, so an inline literal would slam the user's folders
// shut on every render.
const INITIAL_EXPANDED = ["docs", "src", "ui"];

function formatBytes(n: number) {
  return n < 1024 ? n + " B" : (n / 1024).toFixed(1) + " kB";
}

export function FilePicker() {
  const [checked, setChecked] = useState<string[]>([]);

  // onCheck hands you leaf IDs only, so every ID here is a real file and the
  // sum never double-counts a folder.
  const totalBytes = useMemo(
    () => checked.reduce((sum, id) => sum + ((files[id]?.data?.size as number) ?? 0), 0),
    [checked]
  );

  return (
    <div>
      <Tree
        aria-label="Project files"
        data={files}
        estimateSize={30}
        expandedItems={INITIAL_EXPANDED}
        height={300}
        onCheck={setChecked}
        renderItem={({ isFolder, item }) => {
          const size = item.data?.size as number | undefined;
          return (
            <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
              <Glyph isFolder={isFolder} label={item.label} />
              <span>{item.label}</span>
              {size !== undefined && (
                <span style={{ color: "#8a8a8a", fontSize: 11 }}>{formatBytes(size)}</span>
              )}
            </span>
          );
        }}
      />

      <footer style={{ borderTop: "1px solid #2a2a2a", fontSize: 13, padding: "8px 4px" }}>
        {checked.length} file{checked.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
      </footer>
    </div>
  );
}

/** A two-letter extension chip, so the icon set is one function instead of a sprite. */
function Glyph({ isFolder, label }: { isFolder: boolean; label: string }) {
  if (isFolder) return <span aria-hidden="true">▸</span>;
  const ext = label.split(".").pop() ?? "";
  const color = ext === "tsx" ? "#4ade80" : ext === "ts" ? "#60a5fa" : "#8a8a8a";
  return (
    <span
      aria-hidden="true"
      style={{
        border: "1px solid " + color,
        borderRadius: 3,
        color,
        fontSize: 9,
        padding: "1px 3px",
        textTransform: "uppercase",
      }}
    >
      {ext.slice(0, 3)}
    </span>
  );
}`;

const EMPTY_DIR_FIX = `import type { TreeDefinition, TreeItem } from "react-virtual-checkbox-tree";

/**
 * A directory with no files still has \`children: []\`, which the engine reads as
 * "leaf" — it gets a checkbox and shows up in onCheck. Give every known
 * directory a placeholder child so it stays a folder.
 */
export function keepDirectoriesAsFolders(data: TreeDefinition): TreeDefinition {
  const out: TreeDefinition = { ...data };

  for (const [id, item] of Object.entries(data)) {
    const isDeclaredDir = item.data?.kind === "dir";
    const isEmpty = !item.children || item.children.length === 0;
    if (!isDeclaredDir || !isEmpty) continue;

    const placeholderId = id + "__empty";
    out[placeholderId] = {
      id: placeholderId,
      label: "(empty)",
      data: { kind: "placeholder" },
    } satisfies TreeItem;
    out[id] = { ...item, children: [placeholderId] };
  }

  return out;
}

// Then drop the placeholders back out of whatever you submit:
// const files = checkedLeafIds.filter((id) => !id.endsWith("__empty"));`;

export default function Page() {
  return (
    <>
      <ExampleHeader
        scenario="A file attachment dialog: the user opens a project, walks a few folders, and ticks the files they want to send. The footer has to show how many files are selected and how many kilobytes that adds up to, updating on every click."
        title="File picker"
        why="The selection is hierarchical and the user thinks in folders — they want to tick src/ and get everything under it, then untick one file and still see that src/ is partially selected. That partial state is a tri-state checkbox tree, and it is the whole reason not to render a flat list of paths."
      />

      <ExampleBody>
        <ExampleSection
          lede="Click a folder row to open it, click a checkbox to select. The size total is summed from item.data on the leaf IDs onCheck returns."
          title="The demo"
        >
          <DemoFrame note="assets/ is an empty directory. It is flagged in amber because the engine considers it a leaf — see the gotcha below.">
            <FilePickerDemo />
          </DemoFrame>
        </ExampleSection>

        <ExampleSection
          lede="Complete and self-contained: paste it into a client component and it runs."
          title="The source"
        >
          <CodeBlock code={SOURCE} filename="file-picker.tsx" />
        </ExampleSection>

        <ExampleSection title="Props exercised">
          <PropsExercised
            items={[
              {
                name: "data",
                note: "A flat map keyed by node ID with a __root__ entry. Sizes ride along in item.data, which is passed through untouched.",
              },
              {
                name: "renderItem",
                note: "Receives { checkedState, id, isActive, isExpanded, isFolder, item, level } — an object, not the item. Returns the row body only; the row element itself stays the library's.",
              },
              {
                name: "expandedItems",
                note: "Applied whenever the array identity changes, so a module-level constant behaves as an initial value while leaving the user free to open and close folders.",
              },
              {
                name: "onCheck",
                note: "Fires with every checked leaf ID on each change. Folder IDs are never included, which is what makes the byte total safe to compute by summing.",
              },
              {
                name: "estimateSize",
                note: "Row height in pixels, or (index) => number. Defaults to 32; this demo uses 30 for a denser list.",
              },
              {
                name: "height",
                note: "Height of the scroll container. Defaults to \"100%\", which collapses to nothing unless a parent has a fixed height — pass a number when in doubt.",
              },
            ]}
          />
        </ExampleSection>

        <ExampleSection title="The gotcha">
          <Callout title="An empty directory is a checkable leaf" type="warn">
            <p>
              The engine decides what is a folder by looking at <code>children</code>, and nothing
              else. A directory that happens to contain no files arrives as{" "}
              <code>{"children: []"}</code>, which is indistinguishable from a file: it renders with
              a checkbox, it can be checked, and its ID comes back from <code>onCheck</code> as
              though it were a file you could upload.
            </p>
            <p>
              There is no <code>isFolder</code> flag on <code>TreeItem</code> to set. Normalize the
              data before you hand it over — give every known-empty directory a single placeholder
              child, then filter placeholders out of whatever you submit.
            </p>
          </Callout>
          <CodeBlock code={EMPTY_DIR_FIX} filename="keep-directories-as-folders.ts" lang="ts" />
        </ExampleSection>

        <ExampleNav
          next={{ href: "/examples/permissions-matrix", label: "Permissions matrix" }}
          prev={{ href: "/examples", label: "All examples" }}
        />
      </ExampleBody>
    </>
  );
}
