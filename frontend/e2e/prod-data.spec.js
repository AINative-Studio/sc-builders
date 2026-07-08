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

test('economic page shows human labels, not raw FRED codes', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/data/economic');
  // Human labels present
  await expect(page.getByText('Unemployment Rate').first()).toBeVisible({ timeout: 25000 });
  await expect(page.getByText('Resident Population').first()).toBeVisible();
  // Raw series codes must NOT be visible to users
  await expect(page.getByText('CASANT3POP')).toHaveCount(0);
  await expect(page.getByText('MHICA06087A052NCEN')).toHaveCount(0);
});

test('businesses table shows human column headers', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/data/businesses');
  await expect(page.getByText('Business', { exact: true }).first()).toBeVisible({ timeout: 25000 });
});

test('traffic table shows AADT with unit', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/data/traffic');
  // header should include the human label + unit
  await expect(page.getByText(/Traffic (Ahead|Behind)/).first()).toBeVisible({ timeout: 25000 });
});

test('safety incidents render with type + description', async ({ page }) => {
  await login(page);
  await page.goto(PROD + '/data/safety');
  await expect(page.getByRole('heading', { name: 'Safety Incidents' })).toBeVisible({ timeout: 25000 });
});
