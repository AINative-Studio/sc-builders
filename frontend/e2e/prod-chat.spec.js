import { test, expect } from '@playwright/test';

const PROD = 'https://sc-builders.ainative.studio';
const API = 'https://sc-builders-production.up.railway.app';
const EMAIL = `chat_${Date.now()}@example.com`;
const PW = 'Passw0rd!123';

test.use({ baseURL: PROD });

test('real-time chat: send a message and see it render', async ({ page, request }) => {
  test.setTimeout(90000);
  const reg = await request.post(`${API}/api/auth/register`, {
    data: { email: EMAIL, password: PW, handle: 'chate2e', display_name: 'Chat E2E' },
  });
  expect(reg.ok()).toBeTruthy();

  await page.goto(PROD + '/login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PW);
  await page.click('button[type=submit]');
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 20000 });

  await page.goto(PROD + '/chat');
  // Switch to History tab where messages render.
  await page.click('button:has-text("History")');

  const msg = 'e2e chat message ' + Date.now();
  const box = page.locator('input[placeholder*="Reply"], textarea, input[type=text]').last();
  await box.fill(msg);
  await box.press('Enter');

  // The message should appear in the history (sent over WS, echoed back).
  await expect(page.getByText(msg)).toBeVisible({ timeout: 20000 });
});
