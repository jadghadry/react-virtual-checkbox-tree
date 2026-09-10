import Link from "next/link";

/**
 * The shared frame for every page under /examples.
 *
 * Server component on purpose: only the demo inside `DemoFrame` needs to be a
 * client component, and the recipe prose around it should stay static HTML.
 */
export function ExampleHeader({
  scenario,
  title,
  why,
}: {
  scenario: string;
  title: string;
  why: string;
}) {
  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
          <Link className="transition-colors hover:text-[var(--color-fg)]" href="/examples">
            Examples
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
          {scenario}
        </p>
        <p className="mt-3 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">
          <strong className="font-semibold text-[var(--color-fg)]">Why a tree here.</strong> {why}
        </p>
      </div>
    </header>
  );
}

export function ExampleBody({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</div>;
}

export function ExampleSection({
  children,
  id,
  lede,
  title,
}: {
  children: React.ReactNode;
  id?: string;
  lede?: string;
  title: string;
}) {
  return (
    <section className="mb-12" id={id}>
      <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{title}</h2>
      {lede && (
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
          {lede}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** The bordered card every live demo sits in, so all six read as the same object. */
export function DemoFrame({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
        {children}
      </div>
      {note && (
        <figcaption className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--color-faint)]">
          {note}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * The "props exercised" table. Every recipe ends up being read by someone who
 * wants one prop out of it, so the props get their own index rather than being
 * buried in the source listing.
 */
export function PropsExercised({
  items,
}: {
  items: Array<{ name: string; note: string }>;
}) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
      {items.map((item) => (
        <li className="bg-[var(--color-bg)] p-3.5" key={item.name}>
          <code className="font-mono text-[12.5px] text-[var(--color-accent)]">{item.name}</code>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">{item.note}</p>
        </li>
      ))}
    </ul>
  );
}

/** Prev/next between examples, mirroring the docs footer. */
export function ExampleNav({
  next,
  prev,
}: {
  next?: { href: string; label: string };
  prev?: { href: string; label: string };
}) {
  return (
    <nav className="mt-12 flex items-stretch justify-between gap-3 border-t border-[var(--color-border)] pt-6">
      {prev ? (
        <Link
          className="flex-1 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-surface-2)]"
          href={prev.href}
        >
          <span className="block text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
            Previous
          </span>
          <span className="text-[14px]">{prev.label}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link
          className="flex-1 rounded-lg border border-[var(--color-border)] p-3 text-right transition-colors hover:bg-[var(--color-surface-2)]"
          href={next.href}
        >
          <span className="block text-[11px] uppercase tracking-wider text-[var(--color-faint)]">
            Next
          </span>
          <span className="text-[14px]">{next.label}</span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  );
}
