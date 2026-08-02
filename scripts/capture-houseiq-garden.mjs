import { chromium } from "playwright";
import { execFileSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });

function pngToWebp(pngPath, webpPath) {
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
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=82, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}")
`,
    ],
    { stdio: "inherit" }
  );
}

async function shot(page, name) {
  const png = join(tmpDir, `${name}.png`);
  await page.screenshot({ path: png });
  pngToWebp(png, join(outDir, `${name}.webp`));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto("http://127.0.0.1:5175/", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(1000);
  console.log("houseiq body:", (await page.locator("body").innerText()).slice(0, 240));
  await shot(page, "houseiq-2");

  await page.goto("http://127.0.0.1:3000/cart", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(800);
  await shot(page, "garden-ordering-2");

  console.log("ok");
} finally {
  await browser.close();
}
