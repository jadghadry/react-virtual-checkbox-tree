// Mirrors the repo's README and LICENSE into the package directory.
//
// Both matter at publish time and for different reasons. npmjs.com renders the
// README from inside the tarball, and npm only auto-includes a LICENSE that
// sits in the *package* directory — at the repo root it is invisible to a
// workspace package, which would ship an MIT library with no license text in it.
//
// Run by `prepack`; CI runs it with --check so a drifted copy fails the build
// rather than being discovered after a release.
import { copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = join(root, "packages", "react-virtual-checkbox-tree");

const FILES = ["README.md", "LICENSE"];
const check = process.argv.includes("--check");
let drifted = false;

for (const file of FILES) {
  const src = join(root, file);
  const dest = join(pkg, file);

  if (check) {
    let current = null;
    try {
      current = readFileSync(dest, "utf8");
    } catch {
      current = null;
    }
    if (current !== readFileSync(src, "utf8")) {
      console.error(
        `${file} drift: packages/react-virtual-checkbox-tree/${file} is missing or differs from the root copy.`
      );
      drifted = true;
    }
  } else {
    copyFileSync(src, dest);
    console.log(`Copied ${file} -> packages/react-virtual-checkbox-tree/${file}`);
  }
}

if (check) {
  if (drifted) {
    console.error("Run `npm run sync:readme` and commit the result.");
    process.exit(1);
  }
  console.log(`In sync: ${FILES.join(", ")}.`);
}
