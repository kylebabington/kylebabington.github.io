/**
 * Finish MedBridge upload + history + garden workflow only.
 * Assumes HouseIQ already rewritten.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });

const MEDBRIDGE_ENV =
  "c:/dev/CodingTemple/Tech Residency/MEDBRIDGE-B/MedBridge-B/.env";

function loadEnv(filePath) {
  const map = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    )
      val = val.slice(1, -1);
    map[t.slice(0, eq).trim()] = val;
  }
  return map;
}

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
top = (nh - th) // 2
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=85, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}")
`,
    ],
    { stdio: "inherit" }
  );
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".modal-overlay").forEach((el) => el.remove());
    document.body.style.overflow = "";
  });
}

const env = loadEnv(MEDBRIDGE_ENV);
const email = env.TEST_USER_A_EMAIL;
const password = env.TEST_USER_A_PASSWORD;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

try {
  const page = await context.newPage();
  await page.goto("https://med-bridge-b.vercel.app/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.locator(".login-link").first().click();
  await page.waitForSelector(".auth-container", { timeout: 15000 });
  await page.getByRole("button", { name: "Sign-In" }).click();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(1000);
  await dismissOverlays(page);

  // Stay logged in — navigate via history API so SPA routing works
  async function spaGo(path) {
    await dismissOverlays(page);
    await page.evaluate((p) => {
      window.history.pushState({}, "", p);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, path);
    // React Router may need a click instead — fallback:
    await page.waitForTimeout(300);
    const stillWrong = !page.url().includes(path.replace(/^\//, ""));
    if (stillWrong) {
      // Click nav text
      const labels = {
        "/dashboard": "Dashboard",
        "/upload-docs": "Upload Docs",
        "/medical-history": "Medical History",
      };
      await dismissOverlays(page);
      const link = page.getByRole("link", { name: labels[path] });
      if (await link.count()) {
        await link.first().click({ force: true, timeout: 10000 });
      } else {
        // Use NavLink text locator
        await page.locator(`a.nav-item, a`).filter({ hasText: labels[path] }).first().click({ force: true });
      }
    }
    await page.waitForTimeout(1500);
    await dismissOverlays(page);
  }

  // Dashboard clean shot
  await spaGo("/dashboard");
  await page.waitForTimeout(800);
  let png = join(tmpDir, "medbridge-1.png");
  await page.screenshot({ path: png });
  toWebp(png, join(outDir, "medbridge-1.webp"));
  console.log("url after dashboard", page.url());

  await spaGo("/upload-docs");
  console.log("url after upload", page.url());
  await page.waitForTimeout(1000);
  png = join(tmpDir, "medbridge-2.png");
  await page.screenshot({ path: png });
  toWebp(png, join(outDir, "medbridge-2.webp"));

  await spaGo("/medical-history");
  console.log("url after history", page.url());
  await page.waitForTimeout(1000);
  png = join(tmpDir, "medbridge-3.png");
  await page.screenshot({ path: png });
  toWebp(png, join(outDir, "medbridge-3.webp"));
  await page.close();

  // Garden workflow section
  const garden = await context.newPage();
  await garden.goto("http://127.0.0.1:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const section = garden
    .locator("section")
    .filter({ hasText: "How ordering works" })
    .first();
  await section.scrollIntoViewIfNeeded();
  await garden.waitForTimeout(400);
  png = join(tmpDir, "garden-ordering-2-raw.png");
  await section.screenshot({ path: png });
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image
src = Image.open(r"${png.replace(/\\/g, "/")}").convert("RGB")
canvas = Image.new("RGB", (1280, 720), (232, 240, 232))
max_w, max_h = 1180, 620
scale = min(max_w / src.width, max_h / src.height)
nw, nh = int(src.width * scale), int(src.height * scale)
src = src.resize((nw, nh), Image.Resampling.LANCZOS)
canvas.paste(src, ((1280 - nw) // 2, (720 - nh) // 2))
out = r"${join(outDir, "garden-ordering-2.webp").replace(/\\/g, "/")}"
canvas.save(out, "WEBP", quality=85, method=6)
print("wrote", out)
`,
    ],
    { stdio: "inherit" }
  );
  await garden.close();
  console.log("medbridge+garden done");
} finally {
  await browser.close();
}
