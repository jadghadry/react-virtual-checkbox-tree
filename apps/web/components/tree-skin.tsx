/**
 * The library ships zero CSS, so this is the site's own skin for it — a plain
 * wrapper that sets typography and hands the tree a bordered scroll area.
 * It is deliberately small: it doubles as the copy-paste starting point in
 * /docs/styling.
 */
export function TreeSkin({ children }: { children: React.ReactNode }) {
  return <div className="rvct px-2 py-1.5 font-mono">{children}</div>;
}
