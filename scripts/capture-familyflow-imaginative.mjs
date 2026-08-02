/**
 * Capture FamilyFlow imaginative sample activities for carousel slide 4.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });

const LIVE = "https://family-activity-helper-production.up.railway.app";

function toWebp(pngPath, webpPath) {
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image
img = Image.open(r"${pngPath.replace(/\\/g, "/")}").convert("RGB")
w, h = img.size
tw, th = 1280, 720
scale = max(tw / w, th / h)
nw, nh = int(w * scale), int(h * scale)
img = img.resize((nw, nh), Image.Resampling.LANCZOS)
left = (nw - tw) // 2
top = max(0, min((nh - th) // 5, nh - th))
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=85, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${LIVE}/kid`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);

  // Dismiss any login/signup banners if they block
  const maybeLater = page.getByRole("button", { name: /later|skip|continue|dismiss/i });
  if (await maybeLater.count()) {
    await maybeLater.first().click({ timeout: 2000 }).catch(() => {});
  }

  const imaginative = page.getByRole("button", { name: /Imaginative|Pretend/i });
  await imaginative.first().click({ timeout: 10000 });
  await page.waitForTimeout(400);

  const imBored = page.getByRole("button", { name: /I'm Bored|I’m Bored/i });
  await imBored.first().click({ timeout: 10000 });

  // Wait for activity results board (kid page or /quest)
  await Promise.race([
    page.waitForSelector(".quest-choice-card", { timeout: 30000 }),
    page.waitForSelector(".activity-board-panel", { timeout: 30000 }),
    page.waitForURL(/\/quest/, { timeout: 30000 }),
  ]);
  await page.waitForTimeout(2000);

  // If on quest without cards yet, wait a bit more
  if (!(await page.locator(".quest-choice-card").count())) {
    await page.waitForSelector(".quest-choice-card, h2", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  const png = join(tmpDir, "family-activity-helper-4.png");
  await page.screenshot({ path: png });
  toWebp(png, join(outDir, "family-activity-helper-4.webp"));

  const snippet = (await page.locator("body").innerText())
    .slice(0, 500)
    .replace(/\s+/g, " ");
  console.log("url:", page.url());
  console.log("page snippet:", snippet);
  console.log("cards:", await page.locator(".quest-choice-card").count());
  console.log("done");
} catch (err) {
  console.error("FAILED:", err.message);
  const png = join(tmpDir, "family-fail.png");
  await page.screenshot({ path: png }).catch(() => {});
  console.log("fail url:", page.url());
  process.exitCode = 1;
} finally {
  await browser.close();
}
