"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Defers a heavy demo until it is close to the viewport.
 *
 * Three demos generating their datasets on mount would put ~160,000 nodes of
 * synchronous work in front of the first paint — on a page whose entire claim is
 * that this library is fast. Each one now pays for itself only when the reader
 * actually scrolls to it.
 */
export function LazyMount({
  children,
  minHeight = 420,
  label = "demo",
}: {
  children: React.ReactNode;
  label?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || show) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [show]);

  return (
    <div ref={ref}>
      {show ? (
        children
      ) : (
        <div
          className="grid place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[12px] text-[var(--color-faint)]"
          style={{ minHeight }}
        >
          loading {label}…
        </div>
      )}
    </div>
  );
}
