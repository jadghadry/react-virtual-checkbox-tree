export const site = {
  name: "react-virtual-checkbox-tree",
  /** Swap NEXT_PUBLIC_SITE_URL when a custom domain lands — nothing else changes. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://react-virtual-checkbox-tree.vercel.app").replace(
    /\/$/,
    ""
  ),
  tagline: "The React checkbox tree that survives 100,000 nodes.",
  description:
    "Headless, virtualized checkbox tree for React. Tri-state parents that stay correct at 100,000 nodes, ancestor-aware search, full keyboard navigation, and no CSS you didn't write.",
  author: { name: "Jade Ghadry", github: "jadghadry" },
  repo: "https://github.com/jadghadry/react-virtual-checkbox-tree",
  npm: "https://www.npmjs.com/package/react-virtual-checkbox-tree",
  version: "0.2.0",
  license: "MIT",
} as const;

export const nav = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "/examples", label: "Examples" },
  { href: "/compare", label: "Compare" },
] as const;

/**
 * Measured, not estimated. Regenerate with:
 *   npm run build --workspace react-virtual-checkbox-tree && npm run size
 */
export const bundleSize = {
  full: "5.6 kB",
  engine: "3.1 kB",
  withVirtualizer: "12.6 kB",
} as const;

/**
 * Median of 5 runs, Node 26 / Apple Silicon. Reproduce with `npm run bench`.
 * Every number quoted on this site comes from that script.
 */
export const benchmarks = [
  {
    nodes: "1,110",
    build: "1.3 ms",
    flatten: "0.3 ms",
    cascade: "3 µs",
    readSelection: "53 µs",
    search: "142 µs",
  },
  {
    nodes: "11,110",
    build: "9.6 ms",
    flatten: "2.2 ms",
    cascade: "1 µs",
    readSelection: "320 µs",
    search: "957 µs",
  },
  {
    nodes: "111,110",
    build: "115 ms",
    flatten: "25 ms",
    cascade: "1 µs",
    readSelection: "3.7 ms",
    search: "11.5 ms",
  },
  {
    nodes: "1,111,110",
    build: "1,955 ms",
    flatten: "684 ms",
    cascade: "1 µs",
    readSelection: "75.8 ms",
    search: "169 ms",
  },
] as const;
