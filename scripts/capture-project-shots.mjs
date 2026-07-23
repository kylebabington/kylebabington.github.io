/**
 * Capture 1280x720 WebP screenshots for portfolio project cards.
 * Requires local apps running:
 *   Family  http://127.0.0.1:5173
 *   HouseIQ http://127.0.0.1:5174 (auth UI) + CSS file for dashboard mock
 *   Garden  http://127.0.0.1:3000
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(outDir, { recursive: true });
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
top = max(0, (nh - target_h) // 5)  # bias toward upper band for card crop
img = img.crop((left, top, left + target_w, top + target_h))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=82, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

function houseIqDashboardHtml(css) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HouseIQ</title>
<style>${css}
.user-menu { display:flex; align-items:center; gap:0.75rem; text-align:left; }
.user-details { display:flex; flex-direction:column; font-size:0.85rem; color:var(--muted); }
.user-details strong { color:var(--ink); }
.secondary-button { background:transparent; border:1px solid var(--border); border-radius:999px; padding:0.55rem 1rem; color:var(--forest-dark); }
.home-card { display:flex; flex-direction:column; gap:0.25rem; width:100%; text-align:left; padding:0.9rem 1rem; border-radius:16px; border:1px solid var(--border); background:rgba(255,255,255,0.7); margin-top:0.6rem; }
.home-card.active { border-color:var(--forest); box-shadow:0 0 0 2px rgba(47,93,58,0.18); }
.home-card span { color:var(--muted); font-size:0.85rem; }
.stack { display:flex; flex-direction:column; gap:0.65rem; }
.stack input, .stack textarea, .agent-form textarea { width:100%; border:1px solid var(--border); border-radius:14px; padding:0.75rem 0.9rem; background:#fff; }
.stack button, .agent-form button, button[type="submit"] { border:0; border-radius:999px; padding:0.7rem 1.1rem; background:var(--forest); color:#fff; font-weight:700; }
.selected-home-header { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; margin-bottom:1.25rem; }
.section-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.85rem; }
.agent-status { font-size:0.8rem; font-weight:700; color:var(--forest); background:var(--sage-light); border-radius:999px; padding:0.35rem 0.7rem; white-space:nowrap; }
.agent-form { display:flex; flex-direction:column; gap:0.75rem; }
.agent-form textarea { min-height:90px; resize:none; }
.agent-response { margin-top:1rem; padding:1rem; border-radius:18px; background:var(--sage-light); border:1px solid var(--border); }
.dashboard-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.75rem; margin:1rem 0; }
.dashboard-summary div { background:#fff; border:1px solid var(--border); border-radius:16px; padding:0.85rem 1rem; }
.dashboard-summary strong { display:block; font-size:1.4rem; color:var(--forest-dark); }
.dashboard-summary span { color:var(--muted); font-size:0.85rem; }
.issue-card { border:1px solid var(--border); border-radius:16px; padding:0.9rem 1rem; background:#fff; margin-top:0.65rem; }
.issue-card strong { display:block; margin-bottom:0.25rem; }
.issue-card p { margin:0; color:var(--muted); font-size:0.92rem; }
</style>
</head>
<body>
<main class="app-shell">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Agentic home memory</p>
      <h1>HouseIQ</h1>
      <p class="hero-text">Your home remembers everything. HouseIQ makes sure you do too.</p>
    </div>
    <div class="user-menu">
      <div class="user-details">
        <strong>Alex Homeowner</strong>
        <span>alex@example.com</span>
      </div>
      <button type="button" class="secondary-button">Log out</button>
    </div>
  </section>
  <section class="layout">
    <aside class="panel sidebar">
      <h2>Your Homes</h2>
      <div class="home-list">
        <button type="button" class="home-card active">
          <strong>1978 Ranch</strong>
          <span>Built 1978</span>
        </button>
        <button type="button" class="home-card">
          <strong>Lake Cabin</strong>
          <span>Built 1994</span>
        </button>
      </div>
    </aside>
    <section class="panel main-panel">
      <header class="selected-home-header">
        <div>
          <p class="eyebrow">Current home</p>
          <h2>1978 Ranch</h2>
          <p>Original single-story with updated kitchen and aging west windows.</p>
        </div>
        <button type="button" class="secondary-button">Refresh Records</button>
      </header>
      <section class="agent-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Talk naturally</p>
            <h3>Tell HouseIQ what is happening</h3>
          </div>
          <span class="agent-status">Memory agent active</span>
        </div>
        <form class="agent-form" onsubmit="return false">
          <textarea readonly>The west bedroom window leaked again during last night's storm. I already sealed the outside trim with silicone. What should I do next?</textarea>
          <button type="button">Send to HouseIQ</button>
        </form>
        <div class="agent-response">
          <p class="eyebrow">HouseIQ response</p>
          <strong>Likely ongoing water intrusion at the west window assembly.</strong>
          <p>Log this as an open issue, check interior sill for staining, and schedule a glazier if the leak returns after the seal cures.</p>
        </div>
      </section>
      <section class="dashboard-section">
        <div class="dashboard-summary">
          <div><strong>3</strong><span>Open issues</span></div>
          <div><strong>12</strong><span>Documents</span></div>
          <div><strong>7</strong><span>Appliances</span></div>
        </div>
        <div class="issue-card">
          <strong>West bedroom window leak</strong>
          <p>Status: monitoring · Last seen after heavy rain · Est. $250–$900</p>
        </div>
        <div class="issue-card">
          <strong>HVAC filter reminder</strong>
          <p>Status: due soon · 16x25x1 filter · Every 90 days</p>
        </div>
      </section>
    </section>
  </section>
</main>
</body>
</html>`;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

async function shotUrl(url, name, readySelector) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  if (readySelector) {
    await page.waitForSelector(readySelector, { timeout: 30000 });
  }
  await page.waitForTimeout(800);
  const png = join(tmpDir, `${name}.png`);
  await page.screenshot({ path: png, type: "png" });
  await page.close();
  const webp = join(outDir, `${name}.webp`);
  pngToWebp(png, webp);
}

async function shotHouseIq() {
  const cssPath = "c:/dev/Personal/HouseIQ/frontend/src/index.css";
  const css = readFileSync(cssPath, "utf8");
  const html = houseIqDashboardHtml(css);
  const htmlPath = join(tmpDir, "houseiq.html");
  writeFileSync(htmlPath, html, "utf8");

  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), {
    waitUntil: "load",
  });
  await page.waitForTimeout(500);
  const png = join(tmpDir, "houseiq.png");
  await page.screenshot({ path: png, type: "png" });
  await page.close();
  pngToWebp(png, join(outDir, "houseiq.webp"));
}

try {
  console.log("Capturing Family Activity Helper...");
  await shotUrl(
    "http://127.0.0.1:5173/kid",
    "family-activity-helper",
    "h1"
  );

  console.log("Capturing Garden Ordering...");
  await shotUrl("http://127.0.0.1:3000/", "garden-ordering", "h1");

  console.log("Capturing HouseIQ dashboard mock (real CSS)...");
  await shotHouseIq();

  console.log("Done.");
} finally {
  await browser.close();
}
