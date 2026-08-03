/**
 * Fiverr FamilyFlow portfolio shots (product-first, 5 ordered uploads).
 * Skips near-duplicates of existing carousel shots unless the crop is tighter.
 *
 * Out:
 *   assets/projects/fiverr/familyflow-01-hero-1024x768.png
 *   assets/projects/fiverr/familyflow-02-activity.png
 *   assets/projects/fiverr/familyflow-03-family.png
 *   assets/projects/fiverr/familyflow-04-plus.png
 *   assets/projects/fiverr/familyflow-05-mobile.png
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "assets", "projects", "fiverr");
const tmpDir = join(__dirname, ".shot-tmp", "fiverr");
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const LIVE = "https://family-activity-helper-production.up.railway.app";

async function dismissNoise(page) {
  const tip = page.getByRole("button", { name: /Skip tip|Later|Dismiss|Continue/i });
  if (await tip.count()) {
    await tip.first().click({ timeout: 2000 }).catch(() => {});
  }
}

async function waitApp(page) {
  await page.waitForSelector("text=FamilyFlow", { timeout: 45000 });
  await page.waitForTimeout(800);
  await dismissNoise(page);
}

/** Inject signed-in plan cards into the live Account Plus panel (same CSS classes). */
async function showPlusPlans(page) {
  await page.evaluate(() => {
    const required = document.querySelector(".billing-account-required");
    const panel = document.querySelector(".billing-panel");
    if (!panel) return;
    const html = `
      <div class="billing-plan-grid">
        <article class="billing-plan-card">
          <p class="billing-plan-name">Monthly</p>
          <p class="billing-plan-price"><strong>$4.99</strong><span>per month</span></p>
          <p>Full FamilyFlow Plus access with monthly billing.</p>
          <button type="button" class="billing-plan-action">Choose monthly</button>
        </article>
        <article class="billing-plan-card billing-plan-card--featured">
          <p class="billing-plan-badge">Best value</p>
          <p class="billing-plan-name">Annual</p>
          <p class="billing-plan-price"><strong>$39.99</strong><span>per year</span></p>
          <p>A full year of FamilyFlow Plus at a lower yearly price.</p>
          <button type="button" class="billing-plan-action">Choose annual</button>
        </article>
      </div>`;
    if (required) {
      required.outerHTML = html;
    } else if (!document.querySelector(".billing-plan-grid")) {
      const header = panel.querySelector(".panel-header");
      if (header) header.insertAdjacentHTML("afterend", html);
    }
  });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });

try {
  // --- 01 Hero: Parent dashboard @ 1024×768 (Fiverr preview) ---
  {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    await page.goto(`${LIVE}/parent`, { waitUntil: "networkidle", timeout: 60000 });
    await waitApp(page);
    await page.getByRole("heading", { name: /Pick what/i }).waitFor({ timeout: 15000 });
    const path = join(outDir, "familyflow-01-hero-1024x768.png");
    await page.screenshot({ path, fullPage: false });
    console.log("wrote", path);
    await page.close();
  }

  // --- 02 Activity: imaginative recommendations, focused on cards ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${LIVE}/kid`, { waitUntil: "networkidle", timeout: 60000 });
    await waitApp(page);

    const imaginative = page.getByRole("button", { name: /Imaginative|Pretend/i });
    await imaginative.first().click({ timeout: 10000 });
    await page.waitForTimeout(400);

    await page.getByRole("button", { name: /I'm Bored|I’m Bored/i }).first().click({ timeout: 10000 });
    await Promise.race([
      page.waitForSelector(".quest-choice-card", { timeout: 30000 }),
      page.waitForURL(/\/quest/, { timeout: 30000 }),
    ]);
    await page.waitForTimeout(1800);

    const cards = page.locator(".quest-choice-card");
    if (await cards.count()) {
      await cards.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }

    // Crop to a focused band: header + recommendation board
    const path = join(outDir, "familyflow-02-activity.png");
    await page.screenshot({ path, fullPage: false });
    console.log("wrote", path, "cards:", await cards.count());
    await page.close();
  }

  // --- 03 Family: Child Profiles (personalization — not a prefs duplicate) ---
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto(`${LIVE}/settings`, { waitUntil: "networkidle", timeout: 60000 });
    await waitApp(page);
    const account = page.getByRole("button", { name: /^Account$/i }).or(
      page.getByText(/^Account$/)
    );
    await account.first().click({ timeout: 8000 });
    await page.getByRole("heading", { name: /Child Profiles/i }).waitFor({ timeout: 10000 });
    const nameInput = page.getByLabel(/Child name/i).or(page.locator('input[type="text"]').first());
    if (await nameInput.count()) await nameInput.first().fill("Maya").catch(() => {});
    const age = page.locator("select").first();
    if (await age.count()) await age.selectOption({ index: 1 }).catch(() => {});
    await page.getByRole("heading", { name: /Child Profiles/i }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const path = join(outDir, "familyflow-03-family.png");
    const panel = page.locator(".panel").filter({ hasText: "Child Profiles" });
    if (await panel.count()) await panel.first().screenshot({ path });
    else await page.screenshot({ path, fullPage: false });
    console.log("wrote", path);
    await page.close();
  }

  // --- 04 Plus / payment: Account billing with plan cards ---
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.goto(`${LIVE}/settings`, { waitUntil: "networkidle", timeout: 60000 });
    await waitApp(page);
    const account = page.getByRole("button", { name: /^Account$/i }).or(
      page.getByText(/^Account$/)
    );
    await account.first().click({ timeout: 8000 });
    await page.getByRole("heading", { name: /FamilyFlow Plus/i }).waitFor({ timeout: 10000 });
    await showPlusPlans(page);
    const plusHeading = page.getByRole("heading", { name: /FamilyFlow Plus/i });
    await plusHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Prefer clipping the billing panel if present
    const panel = page.locator(".billing-panel");
    const path = join(outDir, "familyflow-04-plus.png");
    if (await panel.count()) {
      await panel.first().screenshot({ path });
    } else {
      await page.screenshot({ path, fullPage: false });
    }
    console.log("wrote", path);
    await page.close();
  }

  // --- 05 Mobile: Kid mode responsiveness ---
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await page.goto(`${LIVE}/kid`, { waitUntil: "networkidle", timeout: 60000 });
    await waitApp(page);
    await page.getByText(/What sounds good|KID MODE|My energy/i).first().waitFor({ timeout: 15000 });
    const path = join(outDir, "familyflow-05-mobile.png");
    await page.screenshot({ path, fullPage: false });
    console.log("wrote", path);
    await page.close();
  }

  console.log("done — Fiverr set in", outDir);
} catch (err) {
  console.error("FAILED:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
