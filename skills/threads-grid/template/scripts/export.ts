/**
 * Headless export: renders every post exactly like the editor's Export button
 * and writes PNGs + preview + project JSON to ./exports/latest (and a timestamped copy).
 *
 *   pnpm dev            # in another terminal (or already running)
 *   pnpm export
 *
 * Env: THREADS_GRID_URL (default http://localhost:3210), CHROME_PATH (custom browser binary).
 * Browser: CHROME_PATH, else Playwright's cached Chromium, else installed Chrome/Edge.
 */
import { chromium } from "playwright-core";

const url = process.env.THREADS_GRID_URL ?? "http://localhost:3210";

/** CHROME_PATH → Playwright's cached Chromium → installed Chrome → Edge. */
async function launch() {
  const attempts = [
    ...(process.env.CHROME_PATH ? [{ executablePath: process.env.CHROME_PATH }] : []),
    {},
    { channel: "chrome" },
    { channel: "msedge" },
  ];
  for (const opts of attempts) {
    try {
      return await chromium.launch(opts);
    } catch {
      // try next
    }
  }
  console.error("No Chromium browser found. Install Google Chrome, run `npx playwright install chromium`, or set CHROME_PATH.");
  process.exit(1);
}

async function main() {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
  await page.goto(`${url}/?export=disk`, { waitUntil: "networkidle" }).catch((e) => {
    console.error(`Editor not reachable at ${url}. Is \`pnpm dev\` running?\n${e}`);
    process.exit(1);
  });
  const handle = await page.waitForFunction(() => {
    const s = window.__THREADS_GRID_EXPORT__;
    return s && s.status !== "running" ? s : null;
  }, null, { timeout: 180_000 });
  const result = (await handle.jsonValue()) as NonNullable<Window["__THREADS_GRID_EXPORT__"]>;
  await browser.close();
  if (result.status === "error") {
    console.error("✗ Export failed:", result.error);
    process.exit(1);
  }
  console.log(`✓ Exported ${result.files?.length ?? 0} files to ${result.dir} (also ./exports/latest)`);
  for (const f of result.files ?? []) console.log("  " + f);
  if (result.missing?.length) console.warn("  ⚠ missing images:", result.missing.join(", "));
}

main();
