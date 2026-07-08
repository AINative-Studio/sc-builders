import { test, expect } from '@playwright/test';
import fs from 'fs';

const PROD = 'https://sc-builders.ainative.studio';
const SP = '/private/tmp/claude-501/-Users-aideveloper-sc-builders/91091869-8600-4762-9c91-650ced3014c3/scratchpad';
const EMAIL = fs.readFileSync(`${SP}/smoke_email.txt`, 'utf8').trim();
const PW = fs.readFileSync(`${SP}/smoke_pw.txt`, 'utf8').trim();

test.use({ baseURL: PROD });

async function login(page) {
  await page.goto(PROD + '/login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PW);
  await page.click('button[type=submit]');
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 20000 });
}

test('fresh login stores a refresh_token', async ({ page }) => {
  await login(page);
  const rt = await page.evaluate(() => localStorage.getItem('refresh_token'));
  expect(rt, 'refresh_token should be stored after login').toBeTruthy();
});

test('expired access token auto-refreshes on an authed request', async ({ page }) => {
  await login(page);
  // Simulate an expired/invalid access token while keeping the valid refresh_token.
  await page.evaluate(() => localStorage.setItem('token', 'expired.invalid.token'));
  // Drive an AUTHED request through the app's api() layer (members list is public,
  // so use /api/social/me/stats which requires a valid bearer).
  const result = await page.evaluate(async () => {
    const BASE = 'https://sc-builders-production.up.railway.app';
    // Replicate the app's refresh-on-401 by importing nothing — just call the
    // same endpoints the app uses; the app's api.js is what we're testing, so
    // navigate to a page that makes an authed call instead.
    return null;
  });
  await page.goto(PROD + '/intents'); // intents list requires auth
  // If refresh worked, intents page loads without bouncing to /login and the
  // stored token was rotated.
  await page.waitForTimeout(4000);
  expect(page.url()).not.toContain('/login');
  const tok = await page.evaluate(() => localStorage.getItem('token'));
  expect(tok, 'access token should have been refreshed').not.toBe('expired.invalid.token');
});

test('missing refresh_token on 401 redirects to login', async ({ page }) => {
  await login(page);
  // Wipe the refresh_token and invalidate the access token -> unrecoverable 401.
  await page.evaluate(() => {
    localStorage.removeItem('refresh_token');
    localStorage.setItem('token', 'expired.invalid.token');
  });
  await page.goto(PROD + '/members');
  await page.waitForURL(/\/login$/, { timeout: 20000 });
  expect(page.url()).toContain('/login');
});
