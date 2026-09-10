import { comparisons, docsNav, examples } from "@/lib/docs-nav";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Identifiers that markdown would otherwise eat, wrapped in a code span.
 *
 * Two of them occur in the real nav data: the label `<Tree> props`, which reads
 * as an HTML tag and vanishes in any renderer that sanitizes one, and the word
 * `__root__` in a description, which markdown renders as bold "root" — exactly
 * the wrong string for a file whose whole job is transmitting identifiers
 * verbatim.
 */
function codeSpanIdentifiers(text: string): string {
  return text
    .replace(/(?<![`\w])__(\w+)__(?![`\w])/g, "`__$1__`")
    .replace(/(?<!`)(<[A-Za-z][^`<>]*>)(?!`)/g, "`$1`");
}

function link(href: string, label: string, description: string) {
  return `- [${codeSpanIdentifiers(label)}](${site.url}${href}): ${codeSpanIdentifiers(
    description
  )}`;
}

/**
 * `/llms.txt` — the llms.txt convention: an H1, a blockquote summary, then
 * grouped lists of markdown links with one line of description each.
 *
 * Built entirely from `docsNav`, `comparisons` and `examples`, so it cannot
 * drift away from the sidebar. Adding a page in one place adds it here.
 */
function buildLlmsTxt(): string {
  const lines: string[] = [];

  lines.push(`# ${site.name}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(
    `Version ${site.version} (0.x — the API will change before 1.0). ${site.license} licensed.`
  );
  lines.push(`Install with \`npm install ${site.name}\`. Requires React 18 or 19.`);
  lines.push("");
  lines.push(
    "Two entry points: `react-virtual-checkbox-tree` ships the React component with a " +
      '"use client" banner, and `react-virtual-checkbox-tree/engine` ships the headless ' +
      "core with no React and no virtualizer in the bundle."
  );
  lines.push("");
  lines.push(
    "Known non-goals, stated up front so they are not mistaken for gaps in these docs: " +
      "there is no drag-and-drop, no inline rename, no context menus, no `onLoadChildren` " +
      "for lazy children, no checkable folders and no `checkStrictly` mode, and graphs are " +
      "not supported (a node under two parents keeps only the last parent seen)."
  );

  for (const group of docsNav) {
    lines.push("");
    lines.push(`## ${group.title}`);
    lines.push("");
    for (const item of group.items) {
      lines.push(link(item.href, item.label, item.description));
    }
  }

  lines.push("");
  lines.push("## Interactive");
  lines.push("");
  lines.push(
    link("/playground", "Playground", "Generate up to 100,000 nodes and drive the real component.")
  );
  lines.push(link("/examples", "Examples", "Six complete, copyable implementations."));
  for (const example of examples) {
    lines.push(link(`/examples/${example.slug}`, example.label, example.blurb));
  }

  lines.push("");
  lines.push("## Comparisons");
  lines.push("");
  lines.push(link("/compare", "Compare", "How this library differs from the alternatives."));
  for (const comparison of comparisons) {
    lines.push(link(`/compare/${comparison.slug}`, comparison.label, comparison.blurb));
  }

  lines.push("");
  lines.push("## Optional");
  lines.push("");
  lines.push(
    link(
      "/llms-full.txt",
      "llms-full.txt",
      "Every documentation page concatenated into one plain-text file."
    )
  );
  lines.push(`- [GitHub](${site.repo}): source, issues and the benchmark script.`);
  lines.push(`- [npm](${site.npm}): published package and version history.`);
  lines.push("");

  return lines.join("\n");
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
