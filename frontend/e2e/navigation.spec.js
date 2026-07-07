import { test, expect } from '@playwright/test';

test.describe('App navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'admin@ainative.studio');
    await page.fill('input[type="password"]', 'H%dBcjkwLZIe!%9u');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5174/');
  });

  test('rail icons navigate to correct pages', async ({ page }) => {
    // Click Feed icon
    await page.click('[title="Feed"]');
    await expect(page.locator('text=TODAY').first()).toBeVisible({ timeout: 3000 });

    // Click Chat icon
    await page.click('[title="Chat"]');
    await expect(page.getByRole('button', { name: 'State' })).toBeVisible({ timeout: 3000 });

    // Click Events icon
    await page.click('[title="Events"]');
    await expect(page.locator('text=Going').first()).toBeVisible({ timeout: 3000 });

    // Click Members icon
    await page.click('[title="Members"]');
    await expect(page.locator('text=Follow').first()).toBeVisible({ timeout: 3000 });
  });

  test('community data section loads', async ({ page }) => {
    await page.click('[title="Community Data"]');
    await expect(page.locator('text=Data Explorer')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=SQL Playground').first()).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    const themeBtn = page.locator('[title="Theme"]');
    await themeBtn.click();

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await themeBtn.click();
    const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAfter).toBe('light');
  });

  test('command palette opens via search bar click', async ({ page }) => {
    // Click the search bar which triggers onOpenPalette
    await page.locator('text=Search or ask the community').click();
    await expect(page.locator('text=ASK AI')).toBeVisible({ timeout: 2000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('text=ASK AI')).not.toBeVisible();
  });

  test('notification sheet opens via bell button', async ({ page }) => {
    // The bell is a button with 🔔 text
    await page.locator('button:has-text("🔔")').click();
    await expect(page.locator('text=Notifications').first()).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Mark all read')).toBeVisible();
  });
});
