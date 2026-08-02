import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });

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
top = max(0, (nh - th) // 6)
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=85, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}")
`,
    ],
    { stdio: "inherit" }
  );
}

const env = loadEnv(
  "c:/dev/CodingTemple/Tech Residency/MEDBRIDGE-B/MedBridge-B/.env"
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("https://med-bridge-b.vercel.app/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.locator(".login-link").first().click();
  await page.waitForSelector("input[name='email']", { timeout: 15000 });
  await page.locator("input[name='email']").fill(env.TEST_USER_A_EMAIL);
  await page.locator("input[name='password']").fill(env.TEST_USER_A_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Close auth modal via overlay click so AuthContainer unmounts
  // (otherwise its useEffect keeps forcing navigate('/dashboard'))
  const overlay = page.locator(".modal-overlay").first();
  if (await overlay.count()) {
    await overlay.click({ position: { x: 8, y: 8 } });
    await page.waitForTimeout(500);
  }
  // Ensure overlay is gone
  if (await page.locator(".modal-overlay").count()) {
    await page.locator(".modal-overlay").click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(400);
  }
  console.log("modal open?", await page.locator(".modal-overlay").count());

  async function shotNav(href, name) {
    await page.locator(`a[href="${href}"]`).first().click();
    await page.waitForURL(new RegExp(href.replace("/", "\\/")), {
      timeout: 15000,
    });
    await page.waitForTimeout(1200);
    console.log(name, page.url());
    const png = join(tmpDir, `${name}.png`);
    await page.screenshot({ path: png });
    toWebp(png, join(outDir, `${name}.webp`));
  }

  await shotNav("/dashboard", "medbridge-1");
  await shotNav("/upload-docs", "medbridge-2");
  await shotNav("/medical-history", "medbridge-3");
  console.log("success");
} finally {
  await browser.close();
}
