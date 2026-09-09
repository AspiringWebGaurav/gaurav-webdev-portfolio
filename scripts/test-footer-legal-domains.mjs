/**
 * Comprehensive Playwright E2E Test Suite for Footer, Legal Documents, & Domain Sync
 *
 * Verifies:
 * 1. Homepage Footer Links: Terms, Privacy, Chat Guide, Security, Accessibility, and Socials.
 * 2. Terms Page (/terms): Zero occurrences of gauravpatil.online or legacy domains; all mailto links @gauravpatil.site.
 * 3. Privacy Page (/privacy): Zero occurrences of gauravpatil.online or legacy domains; all mailto links @gauravpatil.site.
 * 4. Security Page (/security): Zero occurrences of gauravpatil.online; reports to security@gauravpatil.site.
 * 5. Accessibility Page (/accessibility): Zero occurrences of gauravpatil.online; contact help@gauravpatil.site.
 * 6. Chat Page (/chat): Zero occurrences of gauravpatil.online; guide and policies link to gauravpatil.site.
 * 7. Assistant Window: Footer policy links point cleanly to gauravpatil.site / internal paths.
 *
 * Usage: node scripts/test-footer-legal-domains.mjs
 */

import { chromium } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    console.log(`\n▶ [Test ${passed + failed + 1}] ${name}`);
    await fn();
    console.log(`  ✔ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('==================================================================');
  console.log(`  FOOTER & LEGAL DOMAIN SYNC PLAYWRIGHT TEST SUITE`);
  console.log(`  Target Base URL: ${BASE_URL}`);
  console.log('==================================================================');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  try {
    // -------------------------------------------------------------------------
    // Test 1: Homepage Footer Rendering & Link Structure
    // -------------------------------------------------------------------------
    await runTest('Homepage Footer renders all legal and navigational links correctly', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() >= 400) {
        throw new Error(`Homepage failed to load: status ${response?.status()}`);
      }

      await page.waitForTimeout(1000);

      // Locate footer element
      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();

      // Check footer links
      const termsLink = footer.locator('a[href="/terms"]');
      const privacyLink = footer.locator('a[href="/privacy"]');
      const chatGuideLink = footer.locator('a[href="/chat?guide=true"]');
      const securityLink = footer.locator('a[href="/security"]');
      const accessibilityLink = footer.locator('a[href="/accessibility"]');

      if ((await termsLink.count()) === 0) throw new Error('Footer missing Terms link');
      if ((await privacyLink.count()) === 0) throw new Error('Footer missing Privacy link');
      if ((await chatGuideLink.count()) === 0) throw new Error('Footer missing Chat Guide link');
      if ((await securityLink.count()) === 0) throw new Error('Footer missing Security link');
      if ((await accessibilityLink.count()) === 0) throw new Error('Footer missing Accessibility link');

      // Check copyright notice
      const copyrightText = await footer.innerText();
      if (!copyrightText.includes('Gaurav Patil')) {
        throw new Error(`Footer copyright missing "Gaurav Patil": got "${copyrightText.slice(0, 100)}"`);
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 2: Terms of Service Page (/terms) Domain Verification
    // -------------------------------------------------------------------------
    await runTest('Terms of Service (/terms) has zero gauravpatil.online occurrences and clean mailto links', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(`${BASE_URL}/terms`, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() !== 200) {
        throw new Error(`Expected 200 OK for /terms, received ${response?.status()}`);
      }

      await page.waitForSelector('main', { timeout: 8000 });
      const pageContent = await page.content();

      // Assert zero expired/legacy domain occurrences
      if (pageContent.includes('gauravpatil.online')) {
        throw new Error('Found expired domain "gauravpatil.online" in /terms page content!');
      }
      if (pageContent.includes('gauravservices.eu')) {
        throw new Error('Found legacy domain "gauravservices.eu" in /terms page content!');
      }

      // Verify gauravpatil.site presence
      if (!pageContent.includes('gauravpatil.site')) {
        throw new Error('Expected authenticated domain "gauravpatil.site" in /terms, but was not found.');
      }

      // Check mailto links on the page
      const mailtoLinks = await page.locator('a[href^="mailto:"]').all();
      for (const link of mailtoLinks) {
        const href = await link.getAttribute('href');
        if (!href?.endsWith('@gauravpatil.site')) {
          throw new Error(`Invalid mailto link on /terms: ${href} (expected @gauravpatil.site)`);
        }
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 3: Privacy Policy Page (/privacy) Domain Verification
    // -------------------------------------------------------------------------
    await runTest('Privacy Policy (/privacy) has zero gauravpatil.online occurrences and clean mailto links', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() !== 200) {
        throw new Error(`Expected 200 OK for /privacy, received ${response?.status()}`);
      }

      await page.waitForSelector('main', { timeout: 8000 });
      const pageContent = await page.content();

      // Assert zero expired/legacy domain occurrences
      if (pageContent.includes('gauravpatil.online')) {
        throw new Error('Found expired domain "gauravpatil.online" in /privacy page content!');
      }
      if (pageContent.includes('gauravservices.eu')) {
        throw new Error('Found legacy domain "gauravservices.eu" in /privacy page content!');
      }

      // Verify gauravpatil.site presence
      if (!pageContent.includes('gauravpatil.site')) {
        throw new Error('Expected authenticated domain "gauravpatil.site" in /privacy, but was not found.');
      }

      // Check mailto links on the page
      const mailtoLinks = await page.locator('a[href^="mailto:"]').all();
      for (const link of mailtoLinks) {
        const href = await link.getAttribute('href');
        if (!href?.endsWith('@gauravpatil.site')) {
          throw new Error(`Invalid mailto link on /privacy: ${href} (expected @gauravpatil.site)`);
        }
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 4: Security Policy Page (/security) Domain Verification
    // -------------------------------------------------------------------------
    await runTest('Security Policy (/security) has zero gauravpatil.online occurrences and valid report email', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(`${BASE_URL}/security`, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() !== 200) {
        throw new Error(`Expected 200 OK for /security, received ${response?.status()}`);
      }

      await page.waitForSelector('main', { timeout: 8000 });
      const pageContent = await page.content();

      if (pageContent.includes('gauravpatil.online')) {
        throw new Error('Found expired domain "gauravpatil.online" in /security page content!');
      }

      // Verify security@gauravpatil.site email link
      const secMailto = page.locator('a[href="mailto:security@gauravpatil.site"]');
      if ((await secMailto.count()) === 0) {
        throw new Error('Security page missing link to mailto:security@gauravpatil.site');
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 5: Accessibility Policy Page (/accessibility) Domain Verification
    // -------------------------------------------------------------------------
    await runTest('Accessibility Policy (/accessibility) has zero gauravpatil.online occurrences and valid support email', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(`${BASE_URL}/accessibility`, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() !== 200) {
        throw new Error(`Expected 200 OK for /accessibility, received ${response?.status()}`);
      }

      await page.waitForSelector('main', { timeout: 8000 });
      const pageContent = await page.content();

      if (pageContent.includes('gauravpatil.online')) {
        throw new Error('Found expired domain "gauravpatil.online" in /accessibility page content!');
      }

      // Verify help@gauravpatil.site email link
      const helpMailto = page.locator('a[href="mailto:help@gauravpatil.site"]');
      if ((await helpMailto.count()) === 0) {
        throw new Error('Accessibility page missing link to mailto:help@gauravpatil.site');
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 6: Chat / Assistant Guide Page (/chat) Domain Verification
    // -------------------------------------------------------------------------
    await runTest('Chat Guide (/chat?guide=true) loads cleanly with zero expired domains', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const response = await page.goto(`${BASE_URL}/chat?guide=true`, { waitUntil: 'domcontentloaded' });
      if (!response || response.status() !== 200) {
        throw new Error(`Expected 200 OK for /chat?guide=true, received ${response?.status()}`);
      }

      await page.waitForSelector('main', { timeout: 8000 });
      const pageContent = await page.content();

      if (pageContent.includes('gauravpatil.online')) {
        throw new Error('Found expired domain "gauravpatil.online" in /chat page content!');
      }

      await page.close();
    });

    // -------------------------------------------------------------------------
    // Test 7: Assistant Modal Footer Links
    // -------------------------------------------------------------------------
    await runTest('Assistant Window opens and exhibits clean policy footer links', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.goto(`${BASE_URL}/?chat=open`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Check Assistant dialog
      const dialog = page.locator('[role="dialog"][aria-label="Gaurav Assistant"]');
      await dialog.waitFor({ state: 'visible', timeout: 8000 });

      // Check Assistant footer links
      const termsLink = dialog.locator('footer a[href*="/terms"]');
      const privacyLink = dialog.locator('footer a[href*="/privacy"]');
      const dosDontsLink = dialog.locator('footer a[href*="/chat"]');

      if ((await termsLink.count()) === 0) throw new Error('Assistant footer missing Terms of Service link');
      if ((await privacyLink.count()) === 0) throw new Error('Assistant footer missing Privacy Policy link');
      if ((await dosDontsLink.count()) === 0) throw new Error('Assistant footer missing Do\'s & Don\'ts link');

      // Verify no expired domain in dialog
      const dialogContent = await dialog.innerHTML();
      if (dialogContent.includes('gauravpatil.online')) {
        throw new Error('Found "gauravpatil.online" inside Assistant dialog footer or body!');
      }

      await page.close();
    });

  } finally {
    await browser.close();
  }

  console.log('\n==================================================================');
  console.log(`  PLAYWRIGHT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Playwright suite failure:', err);
  process.exit(1);
});
