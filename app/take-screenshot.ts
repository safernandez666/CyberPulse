import { chromium } from '@playwright/test';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on My Stack tab
    await page.click('button:has-text("My Stack")');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: '.github/screenshots/08-my-stack-tab.png',
      fullPage: false,
    });

    console.log('Screenshot saved to .github/screenshots/08-my-stack-tab.png');
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
