/**
 * Capture multi-view project screenshots for portfolio carousels.
 * Keeps existing primary shots as *-1.webp; adds *-2 / *-3 views.
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync, existsSync, unlinkSync, writeFileSync, readFileSync } from "fs";
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
top = max(0, min((nh - target_h) // 5, nh - target_h))
img = img.crop((left, top, left + target_w, top + target_h))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=82, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

function houseIqIssuesHtml(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${css}
.issue-card{border:1px solid var(--border);border-radius:16px;padding:0.9rem 1rem;background:#fff;margin-top:0.65rem}
.issue-card strong{display:block;margin-bottom:0.25rem}
.issue-card p{margin:0;color:var(--muted);font-size:0.92rem}
.dashboard-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.75rem;margin:1rem 0}
.dashboard-summary div{background:#fff;border:1px solid var(--border);border-radius:16px;padding:0.85rem 1rem}
.dashboard-summary strong{display:block;font-size:1.4rem;color:var(--forest-dark)}
.dashboard-summary span{color:var(--muted);font-size:0.85rem}
.home-card{display:flex;flex-direction:column;gap:0.25rem;width:100%;text-align:left;padding:0.9rem 1rem;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,0.7);margin-top:0.6rem}
.home-card.active{border-color:var(--forest);box-shadow:0 0 0 2px rgba(47,93,58,0.18)}
.home-card span{color:var(--muted);font-size:0.85rem}
.selected-home-header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.secondary-button{background:transparent;border:1px solid var(--border);border-radius:999px;padding:0.55rem 1rem;color:var(--forest-dark)}
.doc-row{display:flex;justify-content:space-between;gap:1rem;padding:0.85rem 0;border-bottom:1px solid var(--border)}
.doc-row:last-child{border-bottom:0}
</style></head><body>
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Agentic home memory</p><h1>HouseIQ</h1><p class="hero-text">Track issues, repairs, and documents in one place.</p></div></section>
  <section class="layout">
    <aside class="panel sidebar"><h2>Your Homes</h2>
      <button type="button" class="home-card active"><strong>1978 Ranch</strong><span>Built 1978</span></button>
      <button type="button" class="home-card"><strong>Lake Cabin</strong><span>Built 1994</span></button>
    </aside>
    <section class="panel main-panel">
      <header class="selected-home-header"><div><p class="eyebrow">Open issues</p><h2>1978 Ranch</h2></div><button type="button" class="secondary-button">Refresh Records</button></header>
      <div class="dashboard-summary"><div><strong>3</strong><span>Open issues</span></div><div><strong>2</strong><span>In progress</span></div><div><strong>$900</strong><span>Est. repairs</span></div></div>
      <div class="issue-card"><strong>West bedroom window leak</strong><p>Status: monitoring · Last seen after heavy rain · Est. $250–$900</p></div>
      <div class="issue-card"><strong>HVAC filter reminder</strong><p>Status: due soon · 16x25x1 filter · Every 90 days</p></div>
      <div class="issue-card"><strong>Garage door sensor battery</strong><p>Status: scheduled · Replace CR2032 · Parts on hand</p></div>
    </section>
  </section>
</main></body></html>`;
}

function houseIqDocsHtml(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${css}
.selected-home-header{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.secondary-button{background:transparent;border:1px solid var(--border);border-radius:999px;padding:0.55rem 1rem;color:var(--forest-dark)}
.home-card{display:flex;flex-direction:column;gap:0.25rem;width:100%;text-align:left;padding:0.9rem 1rem;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,0.7);margin-top:0.6rem}
.home-card.active{border-color:var(--forest)}
.home-card span{color:var(--muted);font-size:0.85rem}
.doc-row{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:0.95rem 0;border-bottom:1px solid var(--border)}
.doc-row strong{display:block}
.doc-row span{color:var(--muted);font-size:0.9rem}
.upload-box{margin-top:1rem;padding:1.25rem;border:1px dashed var(--border);border-radius:18px;background:rgba(255,255,255,0.65);text-align:center}
.upload-box button{margin-top:0.75rem;border:0;border-radius:999px;padding:0.7rem 1.1rem;background:var(--forest);color:#fff;font-weight:700}
</style></head><body>
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Document memory</p><h1>HouseIQ</h1><p class="hero-text">Upload inspections and invoices. HouseIQ turns them into lasting home facts.</p></div></section>
  <section class="layout">
    <aside class="panel sidebar"><h2>Your Homes</h2>
      <button type="button" class="home-card active"><strong>1978 Ranch</strong><span>Built 1978</span></button>
    </aside>
    <section class="panel main-panel">
      <header class="selected-home-header"><div><p class="eyebrow">Documents</p><h2>Home records</h2></div><button type="button" class="secondary-button">Refresh Records</button></header>
      <div class="doc-row"><div><strong>Home inspection report.pdf</strong><span>Analyzed · Water intrusion notes extracted</span></div><span>2.7 MB</span></div>
      <div class="doc-row"><div><strong>HVAC repair invoice.txt</strong><span>Analyzed · Filter size and service date saved</span></div><span>12 KB</span></div>
      <div class="doc-row"><div><strong>Appliance warranty — dryer.pdf</strong><span>Stored · Expires 2028</span></div><span>840 KB</span></div>
      <div class="upload-box"><p class="eyebrow">Add a record</p><strong>Drop a PDF or text file</strong><div><button type="button">Upload document</button></div></div>
    </section>
  </section>
</main></body></html>`;
}

const shots = [
  { name: "family-activity-helper-2", url: "http://127.0.0.1:5173/parent", ready: "h1" },
  { name: "family-activity-helper-3", url: "http://127.0.0.1:5173/settings", ready: "h1" },
  { name: "garden-ordering-2", url: "http://127.0.0.1:3000/plants", ready: "main" },
  { name: "garden-ordering-3", url: "http://127.0.0.1:3000/cart", ready: "main" },
  { name: "medbridge-1", url: "https://med-bridge-b.vercel.app/", ready: "h1, h2" },
  { name: "medbridge-2", url: "https://med-bridge-b.vercel.app/signin", ready: "form, h1, h2, main" },
  { name: "medbridge-3", url: "https://med-bridge-b.vercel.app/upload-docs", ready: "form, h1, h2, main" },
  { name: "houseiq-2", url: "http://127.0.0.1:5174/", ready: "h1" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

async function captureUrl(shot) {
  console.log("Capturing", shot.name, shot.url);
  const page = await context.newPage();
  try {
    await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForSelector(shot.ready, { timeout: 15000 });
    } catch {
      console.warn("ready selector timed out for", shot.name);
    }
    await page.waitForTimeout(1200);
    const png = join(tmpDir, `${shot.name}.png`);
    await page.screenshot({ path: png, type: "png" });
    pngToWebp(png, join(outDir, `${shot.name}.webp`));
  } catch (err) {
    console.error("FAILED", shot.name, err.message);
  } finally {
    await page.close();
  }
}

try {
  for (const shot of shots) {
    await captureUrl(shot);
  }

  // HouseIQ issues + docs views from real CSS
  const css = readFileSync("c:/dev/Personal/HouseIQ/frontend/src/index.css", "utf8");
  for (const [name, html] of [
    ["houseiq-3", houseIqIssuesHtml(css)],
  ]) {
    const htmlPath = join(tmpDir, `${name}.html`);
    writeFileSync(htmlPath, html, "utf8");
    const page = await context.newPage();
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "load" });
    await page.waitForTimeout(400);
    const png = join(tmpDir, `${name}.png`);
    await page.screenshot({ path: png, type: "png" });
    await page.close();
    pngToWebp(png, join(outDir, `${name}.webp`));
  }

  // Also capture docs view as bonus if houseiq-2 failed auth-only looks sparse - write houseiq docs as houseiq-3 if issues already done
  // Keep houseiq-3 as issues; optionally overwrite nothing.

  const renames = [
    ["family-activity-helper.webp", "family-activity-helper-1.webp"],
    ["garden-ordering.webp", "garden-ordering-1.webp"],
    ["houseiq.webp", "houseiq-1.webp"],
  ];
  for (const [from, to] of renames) {
    const src = join(outDir, from);
    const dest = join(outDir, to);
    if (existsSync(src) && !existsSync(dest)) {
      renameSync(src, dest);
      console.log("renamed", from, "->", to);
    }
  }

  const oldMed = join(outDir, "medbridge.png");
  if (existsSync(join(outDir, "medbridge-1.webp")) && existsSync(oldMed)) {
    unlinkSync(oldMed);
    console.log("removed medbridge.png");
  }
} finally {
  await browser.close();
}
