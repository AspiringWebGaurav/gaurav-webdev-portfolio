import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const heroProjects = [
  {
    folder: "send2me",
    url: "https://www.send2me.site",
    name: "Send2Me",
    scrollSteps: [
      { name: "cover.png", scroll: 0 },
      { name: "dashboard.png", scroll: 550 },
      { name: "features.png", scroll: 1100 },
      { name: "mobile.png", isMobile: true },
    ],
  },
  {
    folder: "switchyy",
    url: "https://switchyy.eu.cc",
    name: "Switchyy",
    scrollSteps: [
      { name: "cover.png", scroll: 0 },
      { name: "dashboard.png", scroll: 600 },
      { name: "features.png", scroll: 1200 },
      { name: "mobile.png", isMobile: true },
    ],
  },
  {
    folder: "daretosend",
    url: "https://daretosend.eu.cc",
    name: "DareToSend",
    scrollSteps: [
      { name: "cover.png", scroll: 0 },
      { name: "dashboard.png", scroll: 500 },
      { name: "features.png", scroll: 1000 },
      { name: "mobile.png", isMobile: true },
    ],
  },
  {
    folder: "xurl",
    url: "https://xurl.eu.cc",
    name: "XURL",
    scrollSteps: [
      { name: "cover.png", scroll: 0 },
      { name: "dashboard.png", scroll: 550 },
      { name: "features.png", scroll: 1150 },
      { name: "mobile.png", isMobile: true },
    ],
  },
];

async function captureHeroProjects() {
  console.log("🚀 Launching Edge browser via Playwright for Hero 4 Projects...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  });

  for (const proj of heroProjects) {
    console.log(`\n📸 Processing Hero Project [${proj.name}] at ${proj.url}...`);
    const targetDir = path.join(process.cwd(), "public", "projects", proj.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const page = await context.newPage();
    try {
      await page.goto(proj.url, { waitUntil: "networkidle", timeout: 25000 }).catch(async () => {
        console.log("   ⚠️ Network idle timeout, falling back to domcontentloaded...");
        await page.goto(proj.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      });

      await page.waitForTimeout(2500);

      const title = await page.title();
      console.log(`   ✓ Connected: "${title}"`);

      // 1. Cover (Top of page desktop)
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(targetDir, "cover.png"), fullPage: false });
      console.log(`   ✓ Saved cover.png`);

      // 2. Dashboard / Interaction view
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(targetDir, "dashboard.png"), fullPage: false });
      console.log(`   ✓ Saved dashboard.png`);

      // 3. Features view
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(targetDir, "features.png"), fullPage: false });
      console.log(`   ✓ Saved features.png`);

      // 4. Mobile view
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(targetDir, "mobile.png"), fullPage: false });
      console.log(`   ✓ Saved mobile.png`);

      // Reset viewport
      await page.setViewportSize({ width: 1440, height: 900 });
    } catch (err) {
      console.error(`   ❌ Failed to capture ${proj.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\n🎉 Finished capturing all 4 hero projects successfully!");
}

captureHeroProjects().catch(console.error);
