import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const projects = [
  {
    folder: "gmp",
    url: "https://gauravmanagementportal.eu.cc",
    name: "GMP",
    githubUrl: "https://github.com/AspiringWebGaurav/GMP",
  },
  {
    folder: "gpdrive",
    url: "https://gpdrive.eu.cc",
    name: "GPDrive",
    githubUrl: "https://github.com/AspiringWebGaurav/gauravs-personal-drive",
  },
  {
    folder: "bgmiid",
    url: "https://bgmiid.eu.cc",
    name: "BGMI ID",
    githubUrl: "https://github.com/AspiringWebGaurav/bgmiid",
  },
  {
    folder: "gpmas",
    url: "https://gpmas.eu.cc",
    name: "GPMAS",
    githubUrl: "https://github.com/AspiringWebGaurav/Gauravs-Personal-Mail-Automation-System",
  },
  {
    folder: "myfit",
    url: "https://myfit.eu.cc",
    name: "MyFit",
    githubUrl: "https://github.com/AspiringWebGaurav/MYFIT",
  },
  {
    folder: "gpnotes",
    url: "https://gpnotes.eu.cc",
    name: "GPNotes",
    githubUrl: "https://github.com/AspiringWebGaurav/gaurav-personal-notes",
  },
  {
    folder: "gauravwork",
    url: "https://gauravwork.eu.cc",
    name: "Gaurav Workspace",
    githubUrl: "https://github.com/AspiringWebGaurav/Gauravs-WorkSpace",
  },
  {
    folder: "gauravbuilds",
    url: "https://gauravbuilds.eu.cc",
    name: "Gaurav Builds",
    githubUrl: "https://github.com/AspiringWebGaurav/gaurav-builds",
  },
  {
    folder: "gauravwatch",
    url: "https://gauravwatch.eu.cc",
    name: "Gaurav Watch",
    githubUrl: "https://github.com/AspiringWebGaurav/clock",
  },
  {
    folder: "connectgaurav",
    url: "https://connectgaurav.eu.cc",
    name: "Connect Gaurav",
    githubUrl: "https://github.com/AspiringWebGaurav/connectgaurav",
  },
];

async function captureProjects() {
  console.log("🚀 Launching Edge browser via Playwright...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  });

  const scrapedData = [];

  for (const proj of projects) {
    console.log(`\n📸 Processing [${proj.name}] at ${proj.url}...`);
    const targetDir = path.join(process.cwd(), "public", "projects", proj.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const page = await context.newPage();
    try {
      await page.goto(proj.url, { waitUntil: "networkidle", timeout: 25000 }).catch(async () => {
        console.log("   ⚠️ Network idle timeout, waiting for domcontentloaded...");
        await page.goto(proj.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      });

      await page.waitForTimeout(2000);

      // Extract metadata
      const title = await page.title();
      const metaDesc = await page
        .locator('meta[name="description"]')
        .getAttribute("content")
        .catch(() => "");
      const headings = await page
        .locator("h1, h2, h3")
        .allInnerTexts()
        .catch(() => []);
      const bodySnippet = await page.evaluate(() => {
        return document.body.innerText.substring(0, 1000).replace(/\s+/g, " ");
      });

      scrapedData.push({
        folder: proj.folder,
        url: proj.url,
        githubUrl: proj.githubUrl,
        title,
        metaDesc,
        headings: headings.slice(0, 6),
        bodySnippet,
      });

      console.log(`   ✓ Page Title: "${title}"`);
      console.log(`   ✓ Meta Description: "${metaDesc || "none"}"`);

      // 1. Cover screenshot (Desktop Hero)
      const coverPath = path.join(targetDir, "cover.png");
      await page.screenshot({ path: coverPath, fullPage: false });
      console.log(`   ✓ Saved cover.png`);

      // 2. Scrolled view / Dashboard view
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1000);
      const view2Path = path.join(targetDir, "dashboard.png");
      await page.screenshot({ path: view2Path, fullPage: false });
      console.log(`   ✓ Saved dashboard.png`);

      // 3. Features / Details view (further scroll or full component)
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1000);
      const view3Path = path.join(targetDir, "features.png");
      await page.screenshot({ path: view3Path, fullPage: false });
      console.log(`   ✓ Saved features.png`);

      // 4. Mobile view screenshot
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
      const mobilePath = path.join(targetDir, "mobile.png");
      await page.screenshot({ path: mobilePath, fullPage: false });
      console.log(`   ✓ Saved mobile.png`);

      // Reset viewport for next iteration
      await page.setViewportSize({ width: 1440, height: 900 });
    } catch (err) {
      console.error(`   ❌ Failed to capture ${proj.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const metadataPath = path.join(process.cwd(), "scripts", "scraped-projects.json");
  fs.writeFileSync(metadataPath, JSON.stringify(scrapedData, null, 2));
  console.log(`\n🎉 Finished capturing all projects! Saved metadata to ${metadataPath}`);
}

captureProjects().catch(console.error);
