import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { Callout } from "@/components/callout";
import { CopyButton } from "@/components/copy-button";

/**
 * Shared MDX renderers. Code blocks are highlighted at build time by
 * @shikijs/rehype, so nothing here ships a highlighter to the browser — this
 * only wraps the result in a frame with a copy button.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: ({ children, href, ...props }) => {
      const url = String(href ?? "");
      if (url.startsWith("/")) {
        return (
          <Link href={url} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={url} rel="noreferrer noopener" target="_blank" {...props}>
          {children}
        </a>
      );
    },
    Callout,
    pre: ({ children, ...props }) => {
      const code = extractText(children);
      return (
        <figure className="my-5 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <figcaption className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-1.5">
            <span className="font-mono text-[11px] text-[var(--color-faint)]">
              {String((props as { "data-language"?: string })["data-language"] ?? "code")}
            </span>
            <CopyButton text={code} />
          </figcaption>
          <pre
            className="overflow-x-auto p-3 font-mono text-[12.5px] leading-[1.65] bg-transparent!"
            {...props}
          >
            {children}
          </pre>
        </figure>
      );
    },
    table: (props) => (
      <div className="my-5 overflow-x-auto">
        <table {...props} />
      </div>
    ),
    ...components,
  };
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}
