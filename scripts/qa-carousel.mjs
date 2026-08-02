import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, ".shot-tmp");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("http://127.0.0.1:8765/#projects", {
  waitUntil: "networkidle",
  timeout: 30000,
});
await page.locator("#projects").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Advance first carousel once
await page.locator('[data-carousel]').first().locator('.carousel__btn--next').click({ force: true });
await page.waitForTimeout(400);

await page.locator("#projects").screenshot({
  path: join(outDir, "qa-carousel-desktop.png"),
});
console.log("qa screenshot saved");
await browser.close();
