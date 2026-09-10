export function Section({
  children,
  eyebrow,
  id,
  lede,
  title,
}: {
  children?: React.ReactNode;
  eyebrow?: string;
  id?: string;
  lede?: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id={id}>
      {eyebrow && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{title}</h2>
      {lede && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">{lede}</p>}
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}
