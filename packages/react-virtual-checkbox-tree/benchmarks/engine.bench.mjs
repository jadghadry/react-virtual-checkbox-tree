// Measures the Engine against the built ESM bundle, so the numbers reflect what
// consumers actually install. Every figure quoted in the README or on the docs
// site comes from here — run `npm run bench` to reproduce them.
//
//   npm run build && npm run bench
import { Engine } from "../dist/engine.js";

const SIZES = [1_000, 10_000, 100_000, 1_000_000];

function makeTree(targetLeaves, branching = 10) {
  const data = { __root__: { id: "__root__", label: "root", children: [] } };
  const depth = Math.max(2, Math.ceil(Math.log(targetLeaves) / Math.log(branching)));
  let counter = 0;
  let leaves = 0;

  const build = (parentId, level) => {
    const children = [];
    for (let i = 0; i < branching; i++) {
      if (leaves >= targetLeaves) break;
      const id = `n${counter++}`;
      children.push(id);
      if (level + 1 >= depth) {
        data[id] = { id, label: `file-${id}.ts` };
        leaves++;
      } else {
        data[id] = { id, label: `dir-${id}`, children: [] };
        build(id, level + 1);
      }
    }
    data[parentId].children = children;
  };

  build("__root__", 0);
  return { data, leaves, nodes: counter };
}

function time(label, fn, runs = 5) {
  fn(); // warm up
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return { label, median: samples[Math.floor(samples.length / 2)] };
}

const fmt = (ms) => (ms < 1 ? `${(ms * 1000).toFixed(0)} µs` : `${ms.toFixed(1)} ms`);

console.log(`node ${process.version} · ${process.platform}/${process.arch}\n`);

const table = [];

for (const size of SIZES) {
  const { data, leaves, nodes } = makeTree(size);

  const buildResult = time("build", () => new Engine(data), 3);

  const engine = new Engine(data);
  engine.expandAll();

  const flatten = time("flatten (expandAll)", () => {
    engine.toggleExpanded(engine.getVisibleItems()[0].id);
    engine.toggleExpanded(engine.getVisibleItems()[0].id);
    return engine.getVisibleItems();
  });

  const selectAll = time("check root (cascade)", () => {
    engine.toggle("__root__", true);
    engine.toggle("__root__", false);
  });

  engine.toggle("__root__", true);
  const readAll = time("read full selection", () => {
    engine.uncheckAll();
    engine.toggle("__root__", true);
    return engine.getAllChecked();
  });

  engine.uncheckAll();
  const search = time("search keystroke", () => {
    engine.setSearchQuery("");
    engine.setSearchQuery("file-n1");
  });
  engine.setSearchQuery("");

  table.push({
    nodes: nodes.toLocaleString(),
    leaves: leaves.toLocaleString(),
    "build engine": fmt(buildResult.median),
    "flatten rows": fmt(flatten.median),
    "cascade check": fmt(selectAll.median),
    "read selection": fmt(readAll.median),
    "search keystroke": fmt(search.median),
  });
}

console.table(table);

// The headline claim: a full-tree cascade is one map write, independent of size.
const { data } = makeTree(1_000_000);
const big = new Engine(data);
const t0 = performance.now();
big.toggle("__root__", true);
const cascade = performance.now() - t0;
const t1 = performance.now();
const checked = big.getAllChecked();
const read = performance.now() - t1;
console.log(
  `\n1,000,000-leaf tree: cascade ${fmt(cascade)}, ` +
    `then materializing all ${checked.length.toLocaleString()} IDs takes ${fmt(read)}.`
);
console.log("Rows the renderer mounts at any size: however many fit the viewport.");
