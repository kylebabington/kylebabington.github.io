import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, ".shot-tmp");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://127.0.0.1:8765/#projects", { waitUntil: "networkidle" });
await page.locator("#projects").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Advance each carousel once to verify controls + images load
const carousels = page.locator("[data-carousel]");
const count = await carousels.count();
for (let i = 0; i < count; i++) {
  const c = carousels.nth(i);
  await c.locator(".carousel__btn--next").click({ force: true });
  await page.waitForTimeout(250);
}
await page.locator("#projects").screenshot({ path: join(out, "qa-fixed-carousels.png") });
console.log("qa ok");
await browser.close();
