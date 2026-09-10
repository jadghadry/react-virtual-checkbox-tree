// Prints real min+gzip sizes for each published entry point. The numbers in the
// README and on the site come from here, so they can always be re-derived.
import { gzipSync, brotliCompressSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..", "packages", "react-virtual-checkbox-tree");

const entries = [
  { label: "react-virtual-checkbox-tree", file: "dist/index.js" },
  { label: "react-virtual-checkbox-tree/engine", file: "dist/engine.js" },
  // What a consumer actually adds to their bundle: the component plus its one
  // runtime dependency, with only React treated as already-present.
  {
    label: "+ @tanstack/react-virtual",
    file: "dist/index.js",
    external: ["react", "react-dom", "react/jsx-runtime"],
  },
];

const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
const rows = [];

for (const { file, label } of entries) {
  const abs = join(pkg, file);
  if (!existsSync(abs)) {
    console.error(`Missing ${file} — run \`npm run build\` first.`);
    process.exit(1);
  }
  const out = await build({
    bundle: true,
    entryPoints: [abs],
    external: entries[rows.length].external ?? [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-virtual",
    ],
    format: "esm",
    minify: true,
    write: false,
  });
  const code = Buffer.from(out.outputFiles[0].contents);
  rows.push({
    entry: label,
    raw: kb(readFileSync(abs).length),
    min: kb(code.length),
    gzip: kb(gzipSync(code, { level: 9 }).length),
    brotli: kb(brotliCompressSync(code).length),
  });
}

console.table(rows);
