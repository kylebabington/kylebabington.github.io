import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, ".shot-tmp");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function capture(width, height, name) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:8765/#projects", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForSelector(".projects-grid img");
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const path = join(outDir, name);
  await page.locator("#projects").screenshot({ path });
  console.log("wrote", path);
  await page.close();
  return path;
}

try {
  await capture(390, 844, "qa-mobile-projects.png");
  await capture(1280, 900, "qa-desktop-projects.png");
} finally {
  await browser.close();
}
