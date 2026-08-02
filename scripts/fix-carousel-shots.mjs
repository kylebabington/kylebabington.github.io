/**
 * Fix carousel screenshots per plan:
 * - MedBridge: login with TEST_USER_A from MedBridge .env
 * - HouseIQ: chat / documents / issues, content-centered crops
 * - Garden: hero + How ordering works + admin/orders
 *
 * Credentials are read from MedBridge .env and never written to portfolio files.
 */
import { chromium } from "playwright";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects");
const tmpDir = join(__dirname, ".shot-tmp");
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const MEDBRIDGE_ENV =
  "c:/dev/CodingTemple/Tech Residency/MEDBRIDGE-B/MedBridge-B/.env";
const HOUSEIQ_CSS =
  "c:/dev/Personal/HouseIQ/frontend/src/index.css";

function loadEnv(filePath) {
  const map = {};
  if (!existsSync(filePath)) {
    throw new Error(`Missing env file: ${filePath}`);
  }
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

function pngToWebp(pngPath, webpPath, { biasTop = 0.2 } = {}) {
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
top = max(0, min(int((nh - th) * ${biasTop}), nh - th))
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=84, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

function centerCropPngToWebp(pngPath, webpPath) {
  execFileSync(
    "python",
    [
      "-c",
      `
from PIL import Image
img = Image.open(r"${pngPath.replace(/\\/g, "/")}").convert("RGB")
w, h = img.size
# Focus on central content band (skip sparse margins)
margin_x = int(w * 0.08)
margin_y = int(h * 0.06)
img = img.crop((margin_x, margin_y, w - margin_x, h - margin_y))
w, h = img.size
tw, th = 1280, 720
scale = max(tw / w, th / h)
nw, nh = int(w * scale), int(h * scale)
img = img.resize((nw, nh), Image.Resampling.LANCZOS)
left = (nw - tw) // 2
top = (nh - th) // 2
img = img.crop((left, top, left + tw, top + th))
img.save(r"${webpPath.replace(/\\/g, "/")}", "WEBP", quality=84, method=6)
print("wrote", r"${webpPath.replace(/\\/g, "/")}", img.size)
`,
    ],
    { stdio: "inherit" }
  );
}

function houseIqSharedCss(css) {
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
.app-shell{max-width:1200px;margin:0 auto}
.hero{max-width:100%;justify-content:center;text-align:center}
.layout{max-width:1100px}
`;
}

function houseIqChatHtml(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${houseIqSharedCss(css)}</style></head><body>
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Agentic home memory</p><h1>HouseIQ</h1><p class="hero-text">Your home remembers everything. HouseIQ makes sure you do too.</p></div></section>
  <section class="layout">
    <aside class="panel sidebar"><h2>Your Homes</h2>
      <button type="button" class="home-card active"><strong>1978 Ranch</strong><span>Built 1978</span></button>
      <button type="button" class="home-card"><strong>Lake Cabin</strong><span>Built 1994</span></button>
    </aside>
    <section class="panel main-panel">
      <header class="selected-home-header"><div><p class="eyebrow">Current home</p><h2>1978 Ranch</h2></div><button type="button" class="secondary-button">Refresh Records</button></header>
      <section class="agent-section">
        <div class="section-heading"><div><p class="eyebrow">Talk naturally</p><h3>Tell HouseIQ what is happening</h3></div><span class="agent-status">Memory agent active</span></div>
        <form class="agent-form" onsubmit="return false">
          <textarea readonly>The west bedroom window leaked again during last night's storm. I already sealed the outside trim with silicone. What should I do next?</textarea>
          <button type="button" class="primary">Send to HouseIQ</button>
        </form>
        <div class="agent-response"><p class="eyebrow">HouseIQ response</p><strong>Likely ongoing water intrusion at the west window assembly.</strong><p>Log this as an open issue, check interior sill for staining, and schedule a glazier if the leak returns after the seal cures.</p></div>
      </section>
    </section>
  </section>
</main></body></html>`;
}

function houseIqDocsHtml(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${houseIqSharedCss(css)}</style></head><body>
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

function houseIqIssuesHtml(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><style>${houseIqSharedCss(css)}</style></head><body>
<main class="app-shell">
  <section class="hero"><div class="hero-copy"><p class="eyebrow">Open issues</p><h1>HouseIQ</h1><p class="hero-text">Track repairs and reminders before they become emergencies.</p></div></section>
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

async function shotPage(page, name, { center = false, biasTop = 0.2 } = {}) {
  const png = join(tmpDir, `${name}.png`);
  await page.screenshot({ path: png, type: "png" });
  const webp = join(outDir, `${name}.webp`);
  if (center) centerCropPngToWebp(png, webp);
  else pngToWebp(png, webp, { biasTop });
}

async function captureHouseIq(context) {
  const css = readFileSync(HOUSEIQ_CSS, "utf8");
  const pages = [
    ["houseiq-1", houseIqChatHtml(css)],
    ["houseiq-2", houseIqDocsHtml(css)],
    ["houseiq-3", houseIqIssuesHtml(css)],
  ];
  for (const [name, html] of pages) {
    const htmlPath = join(tmpDir, `${name}.html`);
    writeFileSync(htmlPath, html, "utf8");
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), {
      waitUntil: "load",
    });
    await page.waitForTimeout(400);
    await shotPage(page, name, { center: true });
    await page.close();
  }
}

async function loginMedBridge(page, email, password) {
  await page.goto("https://med-bridge-b.vercel.app/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.locator(".login-link").first().click();
  await page.waitForSelector(".auth-container, .auth-form-wrapper", {
    timeout: 15000,
  });
  // Ensure Sign-In mode
  const signInToggle = page.getByRole("button", { name: "Sign-In" });
  if (await signInToggle.count()) await signInToggle.click();

  await page.locator('input[name="email"], input[type="email"]').first().fill(email);
  await page.locator('input[name="password"], input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for dashboard navigation or success
  try {
    await page.waitForURL(/dashboard|medical-history|upload/, {
      timeout: 25000,
    });
  } catch {
    // Maybe still on same page with modal closed — try direct client nav
    const body = await page.locator("body").innerText();
    if (/invalid|error|failed/i.test(body) && !/dashboard/i.test(page.url())) {
      throw new Error("MedBridge login appears to have failed on live site");
    }
  }
  await page.waitForTimeout(1500);
}

async function captureMedBridge(context, email, password) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log("Logging into MedBridge (live)...");
  try {
    await loginMedBridge(page, email, password);
  } catch (err) {
    console.warn("Live login failed:", err.message);
    await page.close();
    throw err;
  }

  // Dashboard
  if (!/dashboard/.test(page.url())) {
    await page.goto("https://med-bridge-b.vercel.app/dashboard", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
  }
  await page.waitForTimeout(1200);
  await shotPage(page, "medbridge-1", { biasTop: 0.15 });

  // Upload docs via client nav
  const uploadLink = page.locator('a[href="/upload-docs"]').first();
  if (await uploadLink.count()) {
    await uploadLink.click({ force: true });
  } else {
    await page.goto("https://med-bridge-b.vercel.app/upload-docs", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
  }
  await page.waitForTimeout(1500);
  await shotPage(page, "medbridge-2", { biasTop: 0.15 });

  // Medical history
  const histLink = page.locator('a[href="/medical-history"]').first();
  if (await histLink.count()) {
    await histLink.click({ force: true });
  } else {
    await page.goto("https://med-bridge-b.vercel.app/medical-history", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
  }
  await page.waitForTimeout(1500);
  await shotPage(page, "medbridge-3", { biasTop: 0.15 });

  await page.close();
}

async function captureGarden(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("http://127.0.0.1:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);
  await shotPage(page, "garden-ordering-1", { biasTop: 0.12 });

  // How ordering works section
  const process = page.locator("text=How ordering works").first();
  await process.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const box = await process.evaluate((el) => {
    const section = el.closest("section") || el.parentElement;
    const r = section.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height + 40, 720) };
  });
  // Screenshot the process section region if possible, else full page after scroll
  const png = join(tmpDir, "garden-ordering-2.png");
  try {
    await page.locator("section").filter({ hasText: "How ordering works" }).first().screenshot({ path: png });
  } catch {
    await page.screenshot({ path: png, type: "png" });
  }
  pngToWebp(png, join(outDir, "garden-ordering-2.webp"), { biasTop: 0.1 });

  await page.goto("http://127.0.0.1:3000/admin/orders", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await shotPage(page, "garden-ordering-3", { biasTop: 0.15 });
  await page.close();
}

const env = loadEnv(MEDBRIDGE_ENV);
const email = env.TEST_USER_A_EMAIL;
const password = env.TEST_USER_A_PASSWORD;
if (!email || !password) {
  throw new Error("TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD missing from MedBridge .env");
}
console.log("Loaded TEST_USER_A credentials from MedBridge .env (values not printed)");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

try {
  console.log("=== HouseIQ ===");
  await captureHouseIq(context);

  console.log("=== MedBridge ===");
  await captureMedBridge(context, email, password);

  console.log("=== Garden ===");
  await captureGarden(context);

  console.log("ALL CAPTURES DONE");
} catch (err) {
  console.error("CAPTURE FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
