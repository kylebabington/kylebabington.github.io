import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
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
target_w, target_h = 1280, 720
scale = max(target_w / w, target_h / h)
nw, nh = int(w * scale), int(h * scale)
img = img.resize((nw, nh), Image.Resampling.LANCZOS)
left = (nw - target_w) // 2
top = max(0, min((nh - target_h) // 5, nh - target_h))
img = img.crop((left, top, left + target_w, top + target_h))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=82, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

async function shot(page, name) {
  const png = join(tmpDir, `${name}.png`);
  await page.screenshot({ path: png, type: "png" });
  pngToWebp(png, join(outDir, `${name}.webp`));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

try {
  // MedBridge features band (distinct from hero + login modal)
  const med = await context.newPage();
  await med.goto("https://med-bridge-b.vercel.app/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await med.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await med.waitForTimeout(800);
  await shot(med, "medbridge-3");
  await med.close();

  // HouseIQ auth — try 5175 then 5176
  const hq = await context.newPage();
  let hqOk = false;
  for (const port of [5175, 5176, 5177]) {
    try {
      const res = await hq.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "domcontentloaded",
        timeout: 8000,
      });
      const text = await hq.locator("body").innerText();
      if (text.includes("HouseIQ") || text.includes("home memory")) {
        await hq.waitForTimeout(600);
        await shot(hq, "houseiq-2");
        console.log("houseiq captured on", port);
        hqOk = true;
        break;
      }
      console.log("port", port, "not HouseIQ:", text.slice(0, 80).replace(/\s+/g, " "));
    } catch (e) {
      console.log("port", port, "failed", e.message.split("\n")[0]);
    }
  }
  if (!hqOk) console.warn("HouseIQ auth shot skipped");
  await hq.close();

  // Garden shots with longer wait
  const garden = await context.newPage();
  await garden.goto("http://127.0.0.1:3000/tools", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await garden.waitForTimeout(5000);
  await shot(garden, "garden-ordering-2");

  await garden.goto("http://127.0.0.1:3000/admin/orders", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await garden.waitForTimeout(4000);
  await shot(garden, "garden-ordering-3");
  await garden.close();

  // Family on whichever port serves FamilyFlow
  const fam = await context.newPage();
  for (const port of [5174, 5173]) {
    try {
      await fam.goto(`http://127.0.0.1:${port}/parent`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      const text = await fam.locator("body").innerText();
      if (text.includes("Parent") || text.includes("Family") || text.includes("moment")) {
        await fam.waitForTimeout(600);
        await shot(fam, "family-activity-helper-2");
        await fam.goto(`http://127.0.0.1:${port}/settings`, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        await fam.waitForTimeout(600);
        await shot(fam, "family-activity-helper-3");
        console.log("family captured on", port);
        break;
      }
    } catch (e) {
      console.log("family port", port, e.message.split("\n")[0]);
    }
  }
  await fam.close();

  console.log("final recapture done");
} finally {
  await browser.close();
}
