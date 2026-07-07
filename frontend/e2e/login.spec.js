import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('should show login page at root when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('should login with valid credentials and redirect to app', async ({ page }) => {
    await page.goto('http://localhost:5174/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@ainative.studio');
    await page.fill('input[type="password"]', 'H%dBcjkwLZIe!%9u');

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Listen for network
    const loginRequest = page.waitForResponse(resp =>
      resp.url().includes('/api/auth/login') && resp.request().method() === 'POST'
    );

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for the login API response
    const response = await loginRequest;
    const responseBody = await response.json();
    console.log('Login response status:', response.status());
    console.log('Login response has access_token:', !!responseBody.access_token);

    // After successful login, should redirect away from login page
    // Wait for navigation or DOM change
    await page.waitForTimeout(2000);

    // Check current URL - should NOT still be /login
    const url = page.url();
    console.log('Current URL after login:', url);

    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token in localStorage:', !!token);

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }

    // Should have token
    expect(token).toBeTruthy();

    // Should have navigated away from login
    expect(url).not.toContain('/login');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'bad@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Wait for error message to appear
    await page.waitForTimeout(2000);

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('should show app shell after login', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'admin@ainative.studio');
    await page.fill('input[type="password"]', 'H%dBcjkwLZIe!%9u');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // The app shell should show Discover page content
    await expect(page.locator('text=What do you need from')).toBeVisible({ timeout: 5000 });
    // Should NOT be on login page anymore
    expect(page.url()).not.toContain('/login');
  });
});
