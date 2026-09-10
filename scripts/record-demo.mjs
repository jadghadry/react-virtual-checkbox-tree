// Records the live hero demo in a real browser and encodes it as a GIF.
// Nothing here is staged: it drives the actual page with real clicks and
// keystrokes, so the artifact in the README is a recording, not an illustration.
//
// The recording tools are not project dependencies — they are only needed to
// regenerate this one asset, and adding Playwright to the workspace would make
// every CI install download a browser. Install them ad hoc:
//
//   npm i --no-save playwright pngjs gifenc && npx playwright install chromium
//   npm run dev
//   node scripts/record-demo.mjs http://localhost:3000 apps/web/public/demo.gif
//
// Pacing note: clicks are deliberately unhurried. A viewer needs a beat to see
// the state before an action and another to read what changed after it —
// otherwise the metrics row is a blur and the whole point is lost. Typing is
// the exception; nobody types slowly.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import gifenc from "gifenc";

function halve(png) {
  const { width: w, height: h, data } = png;
  const W = Math.floor(w / 2), H = Math.floor(h / 2);
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = (y * W + x) * 4;
      for (let c = 0; c < 4; c++) {
        const a = data[((y * 2) * w + x * 2) * 4 + c];
        const b = data[((y * 2) * w + x * 2 + 1) * 4 + c];
        const e = data[((y * 2 + 1) * w + x * 2) * 4 + c];
        const f = data[((y * 2 + 1) * w + x * 2 + 1) * 4 + c];
        out[d + c] = (a + b + e + f) >> 2;
      }
    }
  }
  return { width: W, height: H, data: out };
}
const { GIFEncoder, quantize, applyPalette } = gifenc;

const URL = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "demo.gif";

const WIDTH = 1080;
const HEIGHT = 900;
const FPS = 10;
const FRAME_MS = Math.round(1000 / FPS);
// A collapsed hold longer than this reads as a stall rather than a pause.
const MAX_HOLD_MS = 2600;

const browser = await chromium.launch();
const page = await browser.newPage({
  colorScheme: "dark",
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2, // retina capture, downscaled on encode
});

// The site is dark-first; make sure the anti-FOUC script picks dark.
await page.addInitScript(() => {
  try {
    localStorage.setItem("rvct-theme", "dark");
  } catch {}
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("[data-rvct-row]");

// The sticky nav overlaps the card during an element screenshot, and the dev
// overlay is not part of the product.
await page.addStyleTag({
  content: `
    header { display: none !important; }
    nextjs-portal, [data-nextjs-dev-tools-button] { display: none !important; }
    html { scroll-behavior: auto !important; }
  `,
});

// Frame the hero demo card only — the nav and headline are not what this asset
// is selling.
const demo = page.locator("[data-hero-demo]").first();
await demo.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const frames = [];
let capturing = true;

async function shoot() {
  const buf = await demo.screenshot({ type: "png" });
  frames.push(PNG.sync.read(buf));
}

// Capture on a fixed cadence while the script below drives the page.
const ticker = (async () => {
  while (capturing) {
    const started = Date.now();
    try {
      await shoot();
    } catch {
      /* the page was mid-navigation; skip this frame */
    }
    const elapsed = Date.now() - started;
    if (elapsed < FRAME_MS) await page.waitForTimeout(FRAME_MS - elapsed);
  }
})();

const wait = (ms) => page.waitForTimeout(ms);

// Every click gets a beat before it (the viewer's eye reaches the control) and
// a longer one after (they read the metrics that changed).
async function click(label, settle = 1900) {
  await wait(450);
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await wait(settle);
}

// ---- the script ----------------------------------------------------------
await wait(1100);

// 1. Scale up to 100,000 nodes.
await click("100k", 2000);

// 2. Expand every one of them. The DOM count does not move — the beat after
//    this click is the one that has to land.
await click("Expand all", 2200);

// 3. Scroll through a hundred thousand rows at a readable speed.
const scroller = page.locator("[data-rvct-tree]").first();
for (let i = 0; i < 13; i++) {
  await scroller.evaluate((el) => el.scrollBy({ top: 620 }));
  await wait(165);
}
await wait(950);
await scroller.evaluate((el) => (el.scrollTop = 0));
await wait(850);

// 4. Cascade a selection across all of them.
await click("Select all", 2100);
await click("Clear", 1300);

// 5. Filter. Typing is the one thing that should feel quick.
const search = page.getByLabel("Filter the tree").first();
await search.click();
await wait(550);
for (const ch of "resolver") {
  await search.pressSequentially(ch, { delay: 0 });
  await wait(105);
}
await wait(1900);

// 6. Check a folder while filtered — only visible leaves are affected.
await wait(400);
const firstRow = page.locator("[data-rvct-row]").first();
await firstRow.click();
await wait(2300);

// Hold on the final state so the loop does not snap back mid-thought.
await wait(1400);

capturing = false;
await ticker;
await browser.close();

// ---- encode --------------------------------------------------------------
console.log(`captured ${frames.length} frames at ${frames[0].width}x${frames[0].height}`);

const encoder = GIFEncoder();
let palette = null;

// The pauses that make the clip readable are, by definition, frames where
// nothing moved. Rather than paying for each one, identical consecutive frames
// collapse into a single frame with a longer delay — so a calmer recording is
// also a smaller file.
const timeline = [];
for (const frame of frames) {
  const { data, width, height } = halve(frame);
  // One palette for the whole clip: the UI is a fixed dark theme, so a shared
  // palette keeps the file small and avoids per-frame color flicker.
  palette ??= quantize(data, 48, { format: "rgb565" });
  const indexed = applyPalette(data, palette, "rgb565");

  const previous = timeline.at(-1);
  if (previous && previous.delay < MAX_HOLD_MS && sameFrame(previous.indexed, indexed)) {
    previous.delay += FRAME_MS;
  } else {
    timeline.push({ delay: FRAME_MS, height, indexed, width });
  }
}

for (const [i, frame] of timeline.entries()) {
  encoder.writeFrame(frame.indexed, frame.width, frame.height, {
    delay: frame.delay,
    palette: i === 0 ? palette : undefined,
    transparent: false,
  });
}

encoder.finish();
const bytes = encoder.bytes();
writeFileSync(OUT, bytes);

const seconds = timeline.reduce((total, f) => total + f.delay, 0) / 1000;
console.log(
  `${OUT}: ${(bytes.length / 1024 / 1024).toFixed(2)} MB · ` +
    `${timeline.length} unique frames from ${frames.length} captured · ${seconds.toFixed(1)}s`
);

function sameFrame(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
