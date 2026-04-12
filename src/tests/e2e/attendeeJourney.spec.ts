import { test, expect } from '@playwright/test';

test.describe('Attendee Journey', () => {
  test('should load main dashboard, check gates and open AI assistant', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the app to load
    await expect(page.locator('text=Venue Heatmap')).toBeVisible({ timeout: 10000 });

    // Open AI modal on mobile layout if visible, otherwise type
    const chatInput = page.locator('input[placeholder="Ask anything about the venue..."]');
    if (await chatInput.isHidden()) {
      await page.locator('button[aria-label="Open AI Assistant"]').click();
    }
    
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Best gate now');
    await page.keyboard.press('Enter');
    
    // Check loading indicator appears
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
});
