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

test('cast an intent end-to-end', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/intents');
  await page.click('text=+ New intent');
  await page.fill('textarea', 'Looking for a Rust and WASM developer to pair with in Santa Cruz');
  await page.click('button:has-text("Cast intent")');
  // Should navigate to the detail page and show parsed keywords
  await page.waitForURL(/\/intents\/[^/]+$/, { timeout: 30000 });
  // Detail page shows the parsed intent + a matches section.
  await expect(page.getByText('MATCHES', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Rust', { exact: false }).first()).toBeVisible();
});

test('post a pinned announcement end-to-end', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/feed');
  await page.click('text=+ Announcement');
  const title = 'Prod smoke ' + Date.now();
  await page.fill('input[placeholder="Announcement title"]', title);
  await page.fill('textarea', 'Verifying announcement authoring on prod.');
  await page.click('button:has-text("Post announcement")');
  // The new pinned announcement should appear
  await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 20000 });
});
