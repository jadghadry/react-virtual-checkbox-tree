import { CopyButton } from "@/components/copy-button";
import { highlight } from "@/lib/highlight";

export async function CodeBlock({
  code,
  filename,
  lang = "tsx",
}: {
  code: string;
  filename?: string;
  lang?: string;
}) {
  const html = await highlight(code, lang);

  return (
    <figure className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Padding and leading match the MDX code blocks in mdx-components.tsx —
          the two renderers sit next to each other on the site and any drift
          between them is visible. */}
      <figcaption className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5">
        <span className="font-mono text-[11px] text-[var(--color-faint)]">{filename ?? lang}</span>
        <CopyButton text={code.trim()} />
      </figcaption>
      <div
        className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] [&_pre]:bg-transparent!"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </figure>
  );
}
