/**
 * Replace FamilyFlow preferences slide with kid profile creation shot.
 */
import { chromium } from "playwright";
import { mkdirSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects", "familyflow");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

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
  await page.goto(`${LIVE}/settings`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);

  // Open Account tab (child profiles live here)
  const accountTab = page.getByRole("button", { name: /^Account$/i }).or(
    page.getByRole("tab", { name: /^Account$/i })
  );
  if (await accountTab.count()) {
    await accountTab.first().click();
  } else {
    // Fallback: click text in settings nav
    await page.locator("button, a, [role='tab']").filter({ hasText: /^Account$/i }).first().click();
  }
  await page.waitForTimeout(600);

  // Fill kid profile form
  await page.getByPlaceholder(/Example: Mia/i).fill("Mia");
  const ageSelect = page.locator("select").first();
  if (await ageSelect.count()) {
    await ageSelect.selectOption("6-9");
  }
  await page.getByPlaceholder(/animals, LEGO/i).fill("animals, LEGO, drawing");
  await page
    .getByPlaceholder(/overwhelmed by loud games/i)
    .fill("gets overwhelmed by loud games");

  // Add the profile so the list shows for a richer shot
  await page.getByRole("button", { name: /Add child profile/i }).click();
  await page.waitForTimeout(800);

  // Scroll child profile section into view if needed
  const heading = page.getByRole("heading", { name: /child/i }).first();
  if (await heading.count()) {
    await heading.scrollIntoViewIfNeeded();
  }

  const png = join(tmpDir, "familyflow-kid-profile.png");
  await page.screenshot({ path: png });

  const webpPath = join(outDir, "03-kid-profile.webp");
  toWebp(png, webpPath);

  // Remove old preferences asset if present
  const oldWebp = join(outDir, "03-preferences.webp");
  if (existsSync(oldWebp)) {
    unlinkSync(oldWebp);
    console.log("removed 03-preferences.webp");
  }

  console.log("url:", page.url());
  console.log(
    "snippet:",
    (await page.locator("body").innerText()).slice(0, 350).replace(/\s+/g, " ")
  );
  console.log("done");
} catch (err) {
  console.error("FAILED:", err.message);
  await page.screenshot({ path: join(tmpDir, "familyflow-kid-fail.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
