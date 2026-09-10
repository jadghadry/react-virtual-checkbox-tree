// Records the live hero demo in a real browser and encodes it as a GIF.
// Nothing here is staged: it drives the actual page with real clicks and
// keystrokes, so the artifact in the README is a recording, not an illustration.
//
//   node record.mjs http://localhost:57860 out.gif
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
const click = (label) => page.getByRole("button", { name: label, exact: true }).first().click();

// ---- the script ----------------------------------------------------------
await wait(700);

// 1. Scale up to 100,000 nodes.
await click("100k");
await wait(1400);

// 2. Expand every one of them. The DOM count does not move.
await click("Expand all");
await wait(1200);

// 3. Scroll through a hundred thousand rows.
const scroller = page.locator("[data-rvct-tree]").first();
for (let i = 0; i < 14; i++) {
  await scroller.evaluate((el) => el.scrollBy({ top: 900 }));
  await wait(90);
}
await wait(400);
await scroller.evaluate((el) => (el.scrollTop = 0));
await wait(500);

// 4. Cascade a selection across all of them.
await click("Select all");
await wait(1300);
await click("Clear");
await wait(600);

// 5. Filter, one character at a time.
const search = page.getByLabel("Filter the tree").first();
await search.click();
for (const ch of "resolver") {
  await search.type(ch, { delay: 0 });
  await wait(140);
}
await wait(1200);

// 6. Check a folder while filtered — only visible leaves are affected.
const firstRow = page.locator("[data-rvct-row]").first();
await firstRow.click();
await wait(1100);

capturing = false;
await ticker;
await browser.close();

// ---- encode --------------------------------------------------------------
console.log(`captured ${frames.length} frames at ${frames[0].width}x${frames[0].height}`);
for (const i of [0, Math.floor(frames.length*0.25), Math.floor(frames.length*0.55), Math.floor(frames.length*0.8), frames.length-1]) {
  writeFileSync(`frame-${i}.png`, PNG.sync.write(frames[i]));
}

const encoder = GIFEncoder();
let palette = null;

for (let i = 0; i < frames.length; i++) {
  const { data, width, height } = halve(frames[i]);
  // One palette for the whole clip: the UI is a fixed dark theme, so a shared
  // palette keeps the file small and avoids per-frame color flicker.
  if (!palette) palette = quantize(data, 48, { format: "rgb565" });
  const indexed = applyPalette(data, palette, "rgb565");
  encoder.writeFrame(indexed, width, height, {
    palette: i === 0 ? palette : undefined,
    delay: FRAME_MS,
    transparent: false,
  });
}

encoder.finish();
const bytes = encoder.bytes();
writeFileSync(OUT, bytes);
console.log(`${OUT}: ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);
