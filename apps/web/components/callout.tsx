const TONES = {
  note: { border: "var(--color-border-strong)", label: "Note" },
  tip: { border: "var(--color-ok)", label: "Tip" },
  warn: { border: "var(--color-warn)", label: "Careful" },
} as const;

export function Callout({
  children,
  title,
  type = "note",
}: {
  children: React.ReactNode;
  title?: string;
  type?: keyof typeof TONES;
}) {
  const tone = TONES[type];
  return (
    <aside
      className="my-5 rounded-r-lg border-l-2 bg-[var(--color-surface)] px-4 py-3"
      style={{ borderLeftColor: tone.border }}
    >
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider" style={{ color: tone.border }}>
        {title ?? tone.label}
      </p>
      <div className="[&>*:last-child]:mb-0 [&>p]:mb-2 [&>p]:text-[13.5px]">{children}</div>
    </aside>
  );
}
