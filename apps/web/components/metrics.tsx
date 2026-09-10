export function MetricBar({ children }: { children: React.ReactNode }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-border)] px-4 py-2.5">
      {children}
    </dl>
  );
}

export function Metric({
  accent,
  label,
  title,
  value,
}: {
  accent?: boolean;
  label: string;
  title?: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5" title={title}>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-faint)]">{label}</dt>
      <dd
        className={`tnum font-mono text-[13px] ${accent ? "text-[var(--color-ok)]" : "text-[var(--color-fg)]"}`}
      >
        {value}
      </dd>
    </div>
  );
}
