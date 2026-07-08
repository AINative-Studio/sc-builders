import { test, expect } from '@playwright/test';

const PROD = 'https://sc-builders.ainative.studio';

// Fresh user each run so the edit is isolated.
const EMAIL = `pe2e_${Date.now()}@example.com`;
const PW = 'Passw0rd!123';

test.use({ baseURL: PROD });

test('user can view and edit their own profile end-to-end', async ({ page, request }) => {
  test.setTimeout(90000); // upstream profile calls are slow (~3s each)
  // Register via API, then log in through the UI.
  const reg = await request.post(`https://sc-builders-production.up.railway.app/api/auth/register`, {
    data: { email: EMAIL, password: PW, handle: 'pe2e', display_name: 'PE2E User' },
  });
  expect(reg.ok()).toBeTruthy();

  await page.goto(PROD + '/login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PW);
  await page.click('button[type=submit]');
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 20000 });

  // Resolve own id from the profile API, then open own profile page.
  const me = await page.evaluate(async () => {
    const r = await fetch('https://sc-builders-production.up.railway.app/api/profile/me', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    });
    return r.json();
  });
  await page.goto(`${PROD}/profile/${me.id}`);

  // "Edit profile" should be available on own profile.
  await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible({ timeout: 20000 });
  await page.click('button:has-text("Edit profile")');

  const loc = 'Aptos, CA ' + Date.now();
  await page.fill('input[placeholder="Santa Cruz, CA"]', loc);
  await page.fill('input[placeholder="https://…"]', 'https://mysite.dev');
  await page.click('button:has-text("Save")');

  // The upstream PATCH is eventually consistent; poll the API until it lands.
  await expect.poll(async () => {
    const p = await page.evaluate(async () => {
      const r = await fetch('https://sc-builders-production.up.railway.app/api/profile/me', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      });
      return r.json();
    });
    return p.location;
  }, { timeout: 30000, intervals: [2000] }).toBe(loc);
});
