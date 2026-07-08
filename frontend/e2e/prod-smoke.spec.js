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

test('login works and lands on app', async ({ page }) => {
  await login(page);
  expect(page.url()).not.toContain('/login');
});

test('forgot-password flow renders', async ({ page }) => {
  await page.goto(PROD + '/login');
  await page.click('text=Forgot password?');
  await expect(page.locator('text=Send reset link')).toBeVisible();
});

test('members directory + follow button render', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/members');
  await expect(page.locator('h1:has-text("Members")')).toBeVisible({ timeout: 15000 });
  // follow buttons should appear on member cards
  await expect(page.locator('button:has-text("Follow")').first()).toBeVisible({ timeout: 15000 });
});

test('intents page + cast form render', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/intents');
  await expect(page.locator('h1:has-text("Intents")')).toBeVisible({ timeout: 15000 });
  await page.click('text=+ New intent');
  await expect(page.locator('textarea')).toBeVisible();
});

test('events page + new event form render', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/events');
  await expect(page.locator('h1:has-text("Events")')).toBeVisible({ timeout: 15000 });
  await page.click('text=+ New event');
  await expect(page.locator('input[placeholder="Event title"]')).toBeVisible();
});

test('feed page + announcement form render', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/feed');
  await expect(page.locator('h1:has-text("Activity")')).toBeVisible({ timeout: 15000 });
  await page.click('text=+ Announcement');
  await expect(page.locator('input[placeholder="Announcement title"]')).toBeVisible();
});
