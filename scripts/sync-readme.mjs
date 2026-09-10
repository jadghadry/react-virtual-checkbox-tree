// Keeps packages/react-virtual-checkbox-tree/README.md identical to the repo
// README, which is what npmjs.com renders. Run by `prepack`, verified in CI.
import { copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "README.md");
const dest = join(root, "packages", "react-virtual-checkbox-tree", "README.md");

if (process.argv.includes("--check")) {
  const a = readFileSync(src, "utf8");
  const b = readFileSync(dest, "utf8");
  if (a !== b) {
    console.error(
      "README drift: packages/react-virtual-checkbox-tree/README.md differs from the root README.\n" +
        "Run `npm run sync:readme` and commit the result."
    );
    process.exit(1);
  }
  console.log("README in sync.");
} else {
  copyFileSync(src, dest);
  console.log("Copied README.md -> packages/react-virtual-checkbox-tree/README.md");
}
