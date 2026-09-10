import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Tree } from "../src/tree";
import type { TreeDefinition } from "../src/types";
import { fileTree } from "./fixtures";

const rows = () => screen.getAllByRole("treeitem");
const labels = () => rows().map((r) => r.textContent?.replace(/^[+−]/, "") ?? "");
const rowFor = (label: string) =>
  rows().find((r) => r.textContent?.replace(/^[+−]/, "") === label)!;

describe("rendering", () => {
  it("exposes a tree with treeitem rows", () => {
    render(<Tree aria-label="Files" data={fileTree} height={400} />);
    expect(screen.getByRole("tree", { name: "Files" })).toBeInTheDocument();
    expect(labels()).toEqual(["docs", "src"]);
  });

  it("puts aria-level, aria-setsize and aria-posinset on every row", () => {
    render(<Tree data={fileTree} expandedItems={["docs"]} height={400} />);
    const docs = rowFor("docs");
    expect(docs).toHaveAttribute("aria-level", "1");
    expect(docs).toHaveAttribute("aria-posinset", "1");
    expect(docs).toHaveAttribute("aria-setsize", "2");

    const readme = rowFor("README.md");
    expect(readme).toHaveAttribute("aria-level", "2");
    expect(readme).toHaveAttribute("aria-setsize", "2");
  });

  it("uses aria-checked, including mixed, rather than aria-selected", async () => {
    const user = userEvent.setup();
    render(<Tree data={fileTree} expandedItems={["docs"]} height={400} />);

    expect(rowFor("docs")).toHaveAttribute("aria-checked", "false");
    await user.click(within(rowFor("README.md")).getByRole("checkbox", { hidden: true }));
    expect(rowFor("docs")).toHaveAttribute("aria-checked", "mixed");
    expect(rowFor("README.md")).toHaveAttribute("aria-checked", "true");
    expect(rowFor("docs")).not.toHaveAttribute("aria-selected");
  });

  it("keeps the visual checkbox out of the tab order and the a11y tree", () => {
    render(<Tree data={fileTree} height={400} />);
    const box = within(rowFor("docs")).getByRole("checkbox", { hidden: true });
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(box).toHaveAttribute("tabindex", "-1");
    // The tree itself is the single tab stop.
    expect(screen.getByRole("tree")).toHaveAttribute("tabindex", "0");
  });

  it("honours a custom row height", () => {
    render(<Tree data={fileTree} estimateSize={56} height={400} />);
    expect(rowFor("docs")).toHaveStyle({ height: "56px" });
  });

  it("renders nothing for a child ID missing from data instead of crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken: TreeDefinition = {
      __root__: { id: "__root__", label: "root", children: ["a", "ghost"] },
      a: { id: "a", label: "A" },
    };
    expect(() => render(<Tree data={broken} height={400} />)).not.toThrow();
    expect(labels()).toEqual(["A"]);
    warn.mockRestore();
  });
});

describe("interaction", () => {
  it("expands and collapses a folder on click", async () => {
    const user = userEvent.setup();
    render(<Tree data={fileTree} height={400} />);
    await user.click(rowFor("docs"));
    expect(labels()).toEqual(["docs", "README.md", "guide.md", "src"]);
    await user.click(rowFor("docs"));
    expect(labels()).toEqual(["docs", "src"]);
  });

  it("reports checked leaf IDs, never folders", async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(<Tree data={fileTree} height={400} onCheck={onCheck} />);
    await user.click(within(rowFor("src")).getByRole("checkbox", { hidden: true }));
    expect(onCheck).toHaveBeenLastCalledWith(expect.arrayContaining(["engine", "tree", "row"]));
    expect(onCheck.mock.lastCall![0]).toHaveLength(3);
  });
});

describe("data updates", () => {
  // Regression test for the bug where swapping `data` rebuilt the Engine and
  // left already-mounted rows wired to the discarded one: clicks became silent
  // no-ops and onCheck/onExpand stopped firing entirely.
  it("stays interactive after the data prop changes identity", async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    const onExpand = vi.fn();

    function Harness() {
      const [extra, setExtra] = useState(false);
      const data: TreeDefinition = extra
        ? {
            ...fileTree,
            __root__: { id: "__root__", label: "root", children: ["docs", "src", "tests"] },
            tests: { id: "tests", label: "tests", children: ["spec"] },
            spec: { id: "spec", label: "engine.test.ts" },
          }
        : { ...fileTree };
      return (
        <>
          <button onClick={() => setExtra(true)} type="button">
            add
          </button>
          <Tree data={data} height={400} onCheck={onCheck} onExpand={onExpand} />
        </>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "add" }));
    expect(labels()).toEqual(["docs", "src", "tests"]);

    onExpand.mockClear();
    await user.click(rowFor("docs"));
    expect(onExpand).toHaveBeenCalled();
    expect(labels()).toContain("README.md");

    onCheck.mockClear();
    await user.click(within(rowFor("README.md")).getByRole("checkbox", { hidden: true }));
    expect(onCheck).toHaveBeenLastCalledWith(["readme"]);
    expect(rowFor("README.md")).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the selection when data is rebuilt", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [n, setN] = useState(0);
      return (
        <>
          <button onClick={() => setN((v) => v + 1)} type="button">
            rerender
          </button>
          <Tree data={{ ...fileTree }} height={400} key={undefined} />
          <span data-testid="n">{n}</span>
        </>
      );
    }

    render(<Harness />);
    await user.click(within(rowFor("src")).getByRole("checkbox", { hidden: true }));
    expect(rowFor("src")).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "rerender" }));
    expect(rowFor("src")).toHaveAttribute("aria-checked", "true");
  });
});

describe("keyboard", () => {
  const setup = async () => {
    const user = userEvent.setup();
    render(<Tree aria-label="Files" data={fileTree} height={400} />);
    await user.tab();
    expect(screen.getByRole("tree")).toHaveFocus();
    return user;
  };

  const active = () => {
    const id = screen.getByRole("tree").getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.textContent?.replace(/^[+−]/, "") : null;
  };

  it("moves with ArrowDown and ArrowUp", async () => {
    const user = await setup();
    await user.keyboard("{ArrowDown}");
    expect(active()).toBe("docs");
    await user.keyboard("{ArrowDown}");
    expect(active()).toBe("src");
    await user.keyboard("{ArrowUp}");
    expect(active()).toBe("docs");
  });

  it("opens with ArrowRight, then steps into the folder", async () => {
    const user = await setup();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(labels()).toContain("README.md");
    await user.keyboard("{ArrowRight}");
    expect(active()).toBe("README.md");
  });

  it("closes with ArrowLeft, then walks up to the parent", async () => {
    const user = await setup();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}");
    expect(active()).toBe("README.md");
    await user.keyboard("{ArrowLeft}");
    expect(active()).toBe("docs");
    await user.keyboard("{ArrowLeft}");
    expect(labels()).not.toContain("README.md");
  });

  it("jumps to first and last with Home and End", async () => {
    const user = await setup();
    await user.keyboard("{End}");
    expect(active()).toBe("src");
    await user.keyboard("{Home}");
    expect(active()).toBe("docs");
  });

  it("toggles the checkbox with Space", async () => {
    const user = await setup();
    await user.keyboard("{ArrowDown} ");
    expect(rowFor("docs")).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(rowFor("docs")).toHaveAttribute("aria-checked", "false");
  });

  it("expands folders with Enter", async () => {
    const user = await setup();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(labels()).toContain("README.md");
  });

  it("jumps to a row by typing its label", async () => {
    const user = await setup();
    await user.keyboard("s");
    expect(active()).toBe("src");
  });

  it("expands everything with *", async () => {
    const user = await setup();
    await user.keyboard("*");
    expect(labels()).toEqual([
      "docs",
      "README.md",
      "guide.md",
      "src",
      "engine.ts",
      "ui",
      "tree.tsx",
      "row.tsx",
    ]);
  });
});
