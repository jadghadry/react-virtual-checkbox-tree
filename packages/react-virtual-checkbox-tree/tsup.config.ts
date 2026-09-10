import { defineConfig } from "tsup";

const shared = {
  clean: false,
  dts: true,
  external: ["react", "react-dom", "@tanstack/react-virtual"],
  format: ["esm", "cjs"] as const,
  minify: false,
  sourcemap: true,
  target: "es2020" as const,
  // tsup's `treeshake` runs a second rollup pass that strips top-level
  // directives, which would silently drop the "use client" banner below.
  // esbuild already tree-shakes, and `"sideEffects": false` lets consumers'
  // bundlers do the rest.
  treeshake: false,
};

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: { index: "src/index.ts" },
    // The main entry renders, so it needs the directive to be usable from a
    // React Server Components graph (Next.js App Router). Without it, importing
    // <Tree> from a server file fails at build time.
    banner: { js: '"use client";' },
  },
  {
    ...shared,
    entry: { engine: "src/engine-entry.ts" },
    // No banner: the Engine is a plain class and must stay server-safe.
  },
]);
