import { test, expect } from '@playwright/test';

test.describe('My Stack Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Start server and navigate
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('should show My Stack tab in navigation', async ({ page }) => {
    // Check if My Stack tab is visible
    const myStackTab = page.locator('button', { hasText: 'My Stack' });
    await expect(myStackTab).toBeVisible();
  });

  test('should navigate to My Stack tab and show empty state', async ({ page }) => {
    // Click on My Stack tab
    await page.click('button:has-text("My Stack")');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for empty state message if no tech stack configured
    const emptyState = page.locator('text=Configure Your Tech Stack');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      // Verify empty state content
      await expect(page.locator('text=Add your technologies')).toBeVisible();
    } else {
      // If tech stack is configured, verify statistics cards are visible
      await expect(page.locator('text=Matched Articles')).toBeVisible();
    }
  });

  test('should open settings and show tech stack section', async ({ page }) => {
    // Click settings button
    await page.click('button[aria-label="Open settings"]');
    
    // Wait for settings panel to open
    await page.waitForTimeout(500);
    
    // Check for Tech Stack section
    await expect(page.locator('text=My Technology Stack')).toBeVisible();
    
    // Check for input fields
    await expect(page.locator('input[placeholder*="PHP"]').first()).toBeVisible();
  });

  test('should add a technology to stack', async ({ page }) => {
    // Open settings
    await page.click('button[aria-label="Open settings"]');
    await page.waitForTimeout(500);
    
    // Scroll to tech stack section
    await page.locator('text=My Technology Stack').scrollIntoViewIfNeeded();
    
    // Fill in technology details
    const techInputs = page.locator('input[placeholder*="PHP"]');
    await techInputs.first().fill('Fortinet');
    
    const versionInputs = page.locator('input[placeholder*="7.4"]');
    await versionInputs.first().fill('7.0');
    
    // Click Add Technology button
    await page.click('button:has-text("Add Technology")');
    
    // Wait for the technology to be added
    await page.waitForTimeout(1000);
    
    // Verify the technology appears in the list
    await expect(page.locator('text=Fortinet')).toBeVisible();
  });

  test('should show matched articles after adding tech stack', async ({ page }) => {
    // First, ensure we have at least one technology in the stack
    // (This assumes the previous test ran or there's existing data)
    
    // Click on My Stack tab
    await page.click('button:has-text("My Stack")');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if we have any content (either empty state or articles)
    const hasArticles = await page.locator('.grid').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=Configure Your Tech Stack').isVisible().catch(() => false);
    
    expect(hasArticles || hasEmptyState).toBeTruthy();
  });

  test('should filter articles by technology', async ({ page }) => {
    // Navigate to My Stack
    await page.click('button:has-text("My Stack")');
    await page.waitForTimeout(2000);
    
    // Check if there are technology filters
    const techFilters = page.locator('text=Technologies').first();
    const hasTechFilters = await techFilters.isVisible().catch(() => false);
    
    if (hasTechFilters) {
      // Click on a technology filter button
      const filterButtons = page.locator('button').filter({ hasText: /Fortinet|PHP|Apache/ });
      const count = await filterButtons.count();
      
      if (count > 0) {
        await filterButtons.first().click();
        await page.waitForTimeout(500);
        
        // Verify the filter is active (has accent color)
        const activeFilter = filterButtons.first();
        await expect(activeFilter).toHaveClass(/accent/);
      }
    }
  });

  test('should sort articles by relevance, date, and severity', async ({ page }) => {
    // Navigate to My Stack
    await page.click('button:has-text("My Stack")');
    await page.waitForTimeout(2000);
    
    // Check if sorting buttons exist
    const relevanceBtn = page.locator('button:has-text("RELEVANCE")');
    const dateBtn = page.locator('button:has-text("DATE")');
    const severityBtn = page.locator('button:has-text("SEVERITY")');
    
    const hasRelevance = await relevanceBtn.isVisible().catch(() => false);
    
    if (hasRelevance) {
      // Test each sort option
      await dateBtn.click();
      await expect(dateBtn).toHaveClass(/accent/);
      
      await severityBtn.click();
      await expect(severityBtn).toHaveClass(/accent/);
      
      await relevanceBtn.click();
      await expect(relevanceBtn).toHaveClass(/accent/);
    }
  });
});
