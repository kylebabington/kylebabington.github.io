/**
 * Recapture problematic slides only.
 * Reads MedBridge TEST_USER_A from .env (never prints values).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(tmpDir, { recursive: true });

const MEDBRIDGE_ENV =
  "c:/dev/CodingTemple/Tech Residency/MEDBRIDGE-B/MedBridge-B/.env";
const HOUSEIQ_CSS =
  "c:/dev/Personal/HouseIQ/frontend/src/index.css";

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

function toWebpFromPng(pngPath, webpPath) {
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image
img = Image.open(r"${pngPath.replace(/\\/g, "/")}").convert("RGB")
w, h = img.size
tw, th = 1280, 720
# letterbox-fit content into 16:9 without aggressive side crop when source is already framed
scale = min(tw / w, th / h) if w/h > tw/th * 1.15 else max(tw / w, th / h)
nw, nh = max(tw, int(w * scale)), max(th, int(h * scale))
# Prefer cover into 1280x720 centered
scale = max(tw / w, th / h)
nw, nh = int(w * scale), int(h * scale)
img = img.resize((nw, nh), Image.Resampling.LANCZOS)
left = (nw - tw) // 2
top = (nh - th) // 2
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=85, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

function houseIqCss(css) {
  return `${css}
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
.section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:0.85rem}
.agent-status{font-size:0.8rem;font-weight:700;color:var(--forest);background:var(--sage-light);border-radius:999px;padding:0.35rem 0.7rem;white-space:nowrap}
.agent-form{display:flex;flex-direction:column;gap:0.75rem}
.agent-form textarea{min-height:110px;resize:none;width:100%;border:1px solid var(--border);border-radius:14px;padding:0.75rem 0.9rem;background:#fff}
.agent-form button,button.primary{border:0;border-radius:999px;padding:0.7rem 1.1rem;background:var(--forest);color:#fff;font-weight:700;align-self:flex-start}
.agent-response{margin-top:1rem;padding:1rem;border-radius:18px;background:var(--sage-light);border:1px solid var(--border)}
.doc-row{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:0.95rem 0;border-bottom:1px solid var(--border)}
.doc-row strong{display:block}
.doc-row span{color:var(--muted);font-size:0.9rem}
.upload-box{margin-top:1rem;padding:1.25rem;border:1px dashed var(--border);border-radius:18px;background:rgba(255,255,255,0.65);text-align:center}
.upload-box button{margin-top:0.75rem;border:0;border-radius:999px;padding:0.7rem 1.1rem;background:var(--forest);color:#fff;font-weight:700}
body{margin:0;background:linear-gradient(135deg,#eef3ea,#dce6d7)}
.shot-frame{width:1280px;height:720px;margin:0 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#eef3ea,#dce6d7)}
.shot-inner{width:1180px;transform:scale(0.92);transform-origin:center center}
.app-shell{padding:1.25rem !important;min-height:auto !important}
.hero{margin-bottom:1rem !important;max-width:100% !important}
.hero h1{font-size:3rem !important}
.layout{max-width:100% !important;margin:0 !important}
`;
}

function wrap(css, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${houseIqCss(css)}</style></head><body>
<div class="shot-frame"><div class="shot-inner">${body}</div></div>
</body></html>`;
}

const chatBody = `
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Agentic home memory</p><h1>HouseIQ</h1><p class="hero-text">Chat turns home problems into lasting memory.</p></div></section>
  <section class="layout">
    <aside class="panel sidebar"><h2>Your Homes</h2>
      <button type="button" class="home-card active"><strong>1978 Ranch</strong><span>Built 1978</span></button>
      <button type="button" class="home-card"><strong>Lake Cabin</strong><span>Built 1994</span></button>
    </aside>
    <section class="panel main-panel">
      <header class="selected-home-header"><div><p class="eyebrow">Current home</p><h2>1978 Ranch</h2></div><button type="button" class="secondary-button">Refresh Records</button></header>
      <div class="section-heading"><div><p class="eyebrow">Talk naturally</p><h3>Tell HouseIQ what is happening</h3></div><span class="agent-status">Memory agent active</span></div>
      <form class="agent-form" onsubmit="return false">
        <textarea readonly>The west bedroom window leaked again during last night's storm. I already sealed the outside trim with silicone. What should I do next?</textarea>
        <button type="button" class="primary">Send to HouseIQ</button>
      </form>
      <div class="agent-response"><p class="eyebrow">HouseIQ response</p><strong>Likely ongoing water intrusion at the west window assembly.</strong><p>Log this as an open issue and check the interior sill for staining.</p></div>
    </section>
  </section>
</main>`;

const docsBody = `
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Document memory</p><h1>HouseIQ</h1><p class="hero-text">Uploads become searchable home facts.</p></div></section>
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
</main>`;

const issuesBody = `
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Open issues</p><h1>HouseIQ</h1><p class="hero-text">Track repairs before they become emergencies.</p></div></section>
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
</main>`;

const env = loadEnv(MEDBRIDGE_ENV);
const email = env.TEST_USER_A_EMAIL;
const password = env.TEST_USER_A_PASSWORD;
if (!email || !password) throw new Error("Missing TEST_USER_A credentials");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

try {
  // --- HouseIQ tight frames ---
  const css = readFileSync(HOUSEIQ_CSS, "utf8");
  for (const [name, body] of [
    ["houseiq-1", chatBody],
    ["houseiq-2", docsBody],
    ["houseiq-3", issuesBody],
  ]) {
    const htmlPath = join(tmpDir, `${name}.html`);
    writeFileSync(htmlPath, wrap(css, body), "utf8");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), {
      waitUntil: "load",
    });
    await page.waitForTimeout(300);
    const png = join(tmpDir, `${name}.png`);
    await page.locator(".shot-frame").screenshot({ path: png });
    toWebpFromPng(png, join(outDir, `${name}.webp`));
    await page.close();
  }

  // --- MedBridge authenticated pages ---
  const med = await context.newPage();
  await med.setViewportSize({ width: 1440, height: 900 });
  await med.goto("https://med-bridge-b.vercel.app/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await med.locator(".login-link").first().click();
  await med.waitForSelector(".auth-container", { timeout: 15000 });
  await med.getByRole("button", { name: "Sign-In" }).click();
  await med.locator('input[name="email"]').fill(email);
  await med.locator('input[name="password"]').fill(password);
  await med.getByRole("button", { name: "Sign In" }).click();
  await med.waitForURL(/dashboard/, { timeout: 30000 });
  // Dismiss "You're signed in" modal / overlay
  await med.waitForTimeout(800);
  await med.evaluate(() => {
    document.querySelectorAll(".modal-overlay, .auth-success").forEach((el) => {
      const overlay = el.closest(".modal-overlay") || el;
      overlay.remove();
    });
    document.body.style.overflow = "";
  });
  await med.waitForTimeout(500);

  // Dashboard
  await med.goto("https://med-bridge-b.vercel.app/dashboard", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await med.waitForTimeout(1000);
  await med.evaluate(() => {
    document.querySelectorAll(".modal-overlay").forEach((el) => el.remove());
  });
  let png = join(tmpDir, "medbridge-1.png");
  await med.screenshot({ path: png });
  toWebpFromPng(png, join(outDir, "medbridge-1.webp"));

  // Upload Docs — client-side nav while authenticated
  await med.locator('a[href="/upload-docs"]').first().click();
  await med.waitForURL(/upload-docs/, { timeout: 15000 });
  await med.waitForTimeout(1500);
  png = join(tmpDir, "medbridge-2.png");
  await med.screenshot({ path: png });
  toWebpFromPng(png, join(outDir, "medbridge-2.webp"));

  // Medical History
  await med.locator('a[href="/medical-history"]').first().click();
  await med.waitForURL(/medical-history/, { timeout: 15000 });
  await med.waitForTimeout(1500);
  png = join(tmpDir, "medbridge-3.png");
  await med.screenshot({ path: png });
  toWebpFromPng(png, join(outDir, "medbridge-3.webp"));
  await med.close();

  // --- Garden How ordering works: full section, padded to 16:9 ---
  const garden = await context.newPage();
  await garden.setViewportSize({ width: 1440, height: 900 });
  await garden.goto("http://127.0.0.1:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const section = garden.locator("section").filter({ hasText: "How ordering works" }).first();
  await section.scrollIntoViewIfNeeded();
  await garden.waitForTimeout(500);
  png = join(tmpDir, "garden-ordering-2-raw.png");
  await section.screenshot({ path: png });
  // Pad section into 1280x720 canvas centered
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image
src = Image.open(r"${png.replace(/\\/g, "/")}").convert("RGB")
canvas = Image.new("RGB", (1280, 720), (232, 240, 232))
# scale section to fit with padding
max_w, max_h = 1200, 640
scale = min(max_w / src.width, max_h / src.height)
nw, nh = int(src.width * scale), int(src.height * scale)
src = src.resize((nw, nh), Image.Resampling.LANCZOS)
x = (1280 - nw) // 2
y = (720 - nh) // 2
canvas.paste(src, (x, y))
out = r"${join(outDir, "garden-ordering-2.webp").replace(/\\/g, "/")}"
canvas.save(out, "WEBP", quality=85, method=6)
print("wrote", out)
`,
    ],
    { stdio: "inherit" }
  );
  await garden.close();

  console.log("recapture fixes done");
} finally {
  await browser.close();
}
