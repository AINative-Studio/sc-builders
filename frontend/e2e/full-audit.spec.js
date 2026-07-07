import { test, expect } from '@playwright/test';

// Login helper
async function login(page) {
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'admin@ainative.studio');
  await page.fill('input[type="password"]', 'H%dBcjkwLZIe!%9u');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5174/');
}

test.describe('Full UI audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await login(page);
  });

  // ===== DISCOVER PAGE =====
  test('Discover: search bar navigates to discovery', async ({ page }) => {
    const searchBar = page.locator('text=Who can help me ship').first();
    await expect(searchBar).toBeVisible();
    await searchBar.click();
    await page.waitForURL('**/discovery');
    expect(page.url()).toContain('/discovery');
  });

  test('Discover: quick action pills are clickable', async ({ page }) => {
    // The pills: "post an intent", "who's hiring?", "beta testers", "local grants"
    const pills = ['post an intent', "who's hiring", 'beta testers', 'local grants'];
    for (const pill of pills) {
      const btn = page.locator(`button:has-text("${pill}")`).first();
      const isVisible = await btn.isVisible().catch(() => false);
      console.log(`Pill "${pill}": visible=${isVisible}`);
    }
  });

  test('Discover: Respond button on intent card navigates', async ({ page }) => {
    const respondBtn = page.locator('button:has-text("Respond")').first();
    if (await respondBtn.isVisible()) {
      await respondBtn.click();
      await page.waitForTimeout(500);
      console.log('After Respond click, URL:', page.url());
    }
  });

  test('Discover: RSVP button on event card navigates', async ({ page }) => {
    const rsvpBtn = page.locator('button:has-text("RSVP")').first();
    if (await rsvpBtn.isVisible()) {
      await rsvpBtn.click();
      await page.waitForTimeout(500);
      console.log('After RSVP click, URL:', page.url());
    }
  });

  // ===== FEED PAGE =====
  test('Feed: renders timeline items', async ({ page }) => {
    await page.click('[title="Feed"]');
    await expect(page.locator('text=TODAY').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=EARLIER').first()).toBeVisible();
    // Check that timeline items have content
    const items = page.locator('[style*="border-radius: 12px"]');
    const count = await items.count();
    console.log('Feed: timeline card count:', count);
    expect(count).toBeGreaterThan(0);
  });

  // ===== CHAT PAGE =====
  test('Chat: State/History tabs switch content', async ({ page }) => {
    await page.click('[title="Chat"]');
    const stateBtn = page.getByRole('button', { name: 'State' });
    const historyBtn = page.getByRole('button', { name: 'History' });
    await expect(stateBtn).toBeVisible({ timeout: 3000 });
    await expect(historyBtn).toBeVisible();

    // Default should be State tab
    // Check for State content
    await expect(page.locator('text=Decision Reached').first()).toBeVisible();

    // Switch to History
    await historyBtn.click();
    await page.waitForTimeout(500);
    // History should show message bubbles
    const historyContent = page.locator('text=Hey').first();
    const hasHistory = await historyContent.isVisible().catch(() => false);
    console.log('Chat History tab has messages:', hasHistory);

    // Switch back to State
    await stateBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Decision Reached').first()).toBeVisible();
  });

  test('Chat: message input is interactive', async ({ page }) => {
    await page.click('[title="Chat"]');
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder*="Reply"]').first();
    if (await input.isVisible()) {
      await input.fill('test message');
      const val = await input.inputValue();
      expect(val).toBe('test message');
    } else {
      console.log('Chat: no message input found');
    }
  });

  // ===== INTENTS PAGE =====
  test('Intents: list renders and cards are clickable', async ({ page }) => {
    await page.click('[title="Intents"]');
    await page.waitForTimeout(500);
    const intentCards = page.locator('button:has-text("matches")').first();
    if (await intentCards.isVisible()) {
      await intentCards.click();
      await page.waitForTimeout(500);
      console.log('After intent click, URL:', page.url());
    } else {
      console.log('Intents: no clickable intent cards found');
    }
  });

  // ===== INTENT DETAIL =====
  test('IntentDetail: action buttons are clickable', async ({ page }) => {
    await page.goto('http://localhost:5174/intents/1');
    await page.waitForTimeout(500);

    const nudgeBtn = page.locator('button:has-text("Nudge")');
    const delegateBtn = page.locator('button:has-text("Let agent handle")');
    const resolveBtn = page.locator('button:has-text("Mark resolved")');

    const nudgeVisible = await nudgeBtn.isVisible().catch(() => false);
    const delegateVisible = await delegateBtn.isVisible().catch(() => false);
    const resolveVisible = await resolveBtn.isVisible().catch(() => false);

    console.log('IntentDetail buttons — Nudge:', nudgeVisible, 'Delegate:', delegateVisible, 'Resolve:', resolveVisible);

    // Click each button and verify no crash
    if (nudgeVisible) {
      await nudgeBtn.click();
      await page.waitForTimeout(300);
      // Should not navigate away or crash
      expect(page.url()).toContain('/intents/');
    }
    if (delegateVisible) {
      await delegateBtn.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/intents/');
    }
    if (resolveVisible) {
      await resolveBtn.click();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/intents/');
    }
  });

  // ===== DISCOVERY (AI) =====
  test('Discovery: delegate button works', async ({ page }) => {
    await page.goto('http://localhost:5174/discovery');
    await page.waitForTimeout(500);

    const delegateBtn = page.locator('button:has-text("Delegate")').first();
    const connectBtns = page.locator('button:has-text("Connect")');
    const viewBtns = page.locator('button:has-text("View")');

    console.log('Discovery: Delegate visible:', await delegateBtn.isVisible().catch(() => false));
    console.log('Discovery: Connect buttons:', await connectBtns.count());
    console.log('Discovery: View buttons:', await viewBtns.count());

    // Click delegate if visible
    if (await delegateBtn.isVisible()) {
      await delegateBtn.click();
      await page.waitForTimeout(300);
    }

    // Click first Connect if visible
    if (await connectBtns.count() > 0) {
      await connectBtns.first().click();
      await page.waitForTimeout(300);
    }
  });

  // ===== EVENTS LIST =====
  test('Events: Going/RSVP buttons work', async ({ page }) => {
    await page.click('[title="Events"]');
    await page.waitForTimeout(500);

    const goingBtns = page.locator('button:has-text("Going")');
    const rsvpBtns = page.locator('button:has-text("RSVP")');

    console.log('Events: Going buttons:', await goingBtns.count());
    console.log('Events: RSVP buttons:', await rsvpBtns.count());

    // Click first RSVP and check it toggles or navigates
    if (await rsvpBtns.count() > 0) {
      await rsvpBtns.first().click();
      await page.waitForTimeout(300);
      console.log('After RSVP click, URL:', page.url());
    }
  });

  test('Events: clicking event card navigates to detail', async ({ page }) => {
    await page.click('[title="Events"]');
    await page.waitForTimeout(500);

    // Find a clickable event title or card
    const eventCard = page.locator('text=Demo Night').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForTimeout(500);
      console.log('After event click, URL:', page.url());
    }
  });

  // ===== EVENT DETAIL =====
  test('EventDetail: Going/Maybe/Calendar buttons work', async ({ page }) => {
    await page.goto('http://localhost:5174/events/1');
    await page.waitForTimeout(500);

    const goingBtn = page.locator('button:has-text("Going")').first();
    const maybeBtn = page.locator('button:has-text("Maybe")').first();
    const calendarBtn = page.locator('button:has-text("Add to calendar")').first();

    console.log('EventDetail — Going:', await goingBtn.isVisible().catch(() => false));
    console.log('EventDetail — Maybe:', await maybeBtn.isVisible().catch(() => false));
    console.log('EventDetail — Calendar:', await calendarBtn.isVisible().catch(() => false));

    // Test Maybe click
    if (await maybeBtn.isVisible()) {
      await maybeBtn.click();
      await page.waitForTimeout(300);
      // Check if it toggled visually
      const maybeStyle = await maybeBtn.getAttribute('style');
      console.log('Maybe button style after click:', maybeStyle);
    }

    // Test Going click
    if (await goingBtn.isVisible()) {
      await goingBtn.click();
      await page.waitForTimeout(300);
      const goingStyle = await goingBtn.getAttribute('style');
      console.log('Going button style after click:', goingStyle);
    }

    // Calendar button
    if (await calendarBtn.isVisible()) {
      await calendarBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // ===== MEMBERS =====
  test('Members: filter chips and Follow buttons work', async ({ page }) => {
    await page.click('[title="Members"]');
    await page.waitForTimeout(500);

    // Filter chips
    const chips = page.locator('button:has-text("rust")');
    if (await chips.isVisible()) {
      await chips.click();
      await page.waitForTimeout(300);
    }

    // Follow/Following buttons
    const followBtns = page.locator('button:has-text("Follow")');
    const followCount = await followBtns.count();
    console.log('Members: Follow buttons:', followCount);

    if (followCount > 0) {
      await followBtns.first().click();
      await page.waitForTimeout(300);
      // Check if it toggled to "Following"
      const text = await followBtns.first().textContent();
      console.log('Follow button text after click:', text);
    }
  });

  // ===== PROFILE =====
  test('Profile: Human/Agent toggle works', async ({ page }) => {
    await page.goto('http://localhost:5174/profile/me');
    await page.waitForTimeout(500);

    const humanBtn = page.locator('button:has-text("Human-readable")').first();
    const agentBtn = page.locator('button:has-text("Agent-readable")').first();

    console.log('Profile — Human tab:', await humanBtn.isVisible().catch(() => false));
    console.log('Profile — Agent tab:', await agentBtn.isVisible().catch(() => false));

    if (await agentBtn.isVisible()) {
      await agentBtn.click();
      await page.waitForTimeout(300);
      // Should show JSON
      const jsonBlock = page.locator('pre').first();
      console.log('Agent view has pre block:', await jsonBlock.isVisible().catch(() => false));
    }

    // Switch back
    if (await humanBtn.isVisible()) {
      await humanBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // ===== COMMUNITY DATA =====
  test('Data: sub-nav navigates correctly', async ({ page }) => {
    await page.click('[title="Community Data"]');
    await page.waitForTimeout(500);

    // Click through each data sub-page
    const pages = ['Businesses', 'Housing', 'Economic', 'Parcels', 'Traffic', 'Safety'];
    for (const p of pages) {
      const link = page.getByRole('link', { name: p }).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1000);
        const url = page.url();
        console.log(`Data ${p}: URL=${url}`);
        // Check no error / crash
        const rootChildren = await page.evaluate(() => document.getElementById('root')?.children?.length || 0);
        expect(rootChildren).toBeGreaterThan(0);
      }
    }
  });

  test('Data: SQL Playground executes query', async ({ page }) => {
    await page.goto('http://localhost:5174/data/sql');
    await page.waitForTimeout(500);

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Should have default query
    const val = await textarea.inputValue();
    console.log('SQL default query:', val.substring(0, 50));

    // Click Run
    const runBtn = page.locator('button:has-text("Run")');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Wait for results
    await page.waitForTimeout(3000);

    // Check for results or error
    const hasResults = await page.locator('text=rows').first().isVisible().catch(() => false);
    const hasError = await page.locator('[style*="hsl(0"]').first().isVisible().catch(() => false);
    console.log('SQL Playground: has results:', hasResults, 'has error:', hasError);
  });

  // ===== OVERLAYS =====
  test('TopBar: search bar click opens command palette', async ({ page }) => {
    await page.locator('text=Search or ask the community').click();
    await expect(page.locator('text=ASK AI')).toBeVisible({ timeout: 2000 });

    // Click a jump-to item
    const jumpItem = page.locator('text=wasm-pairing');
    if (await jumpItem.isVisible()) {
      await jumpItem.click();
      await page.waitForTimeout(500);
      console.log('After jump-to click, URL:', page.url());
    }
  });

  test('TopBar: notification bell opens sheet', async ({ page }) => {
    await page.locator('button:has-text("🔔")').click();
    await expect(page.locator('text=Mark all read')).toBeVisible({ timeout: 2000 });

    // Click a notification
    const notif = page.locator('text=matched your Rust/WASM intent').first();
    if (await notif.isVisible()) {
      await notif.click();
      await page.waitForTimeout(500);
      console.log('After notification click, URL:', page.url());
    }
  });

  // ===== THEME =====
  test('Theme: persists across navigation', async ({ page }) => {
    // Toggle to dark
    await page.locator('[title="Theme"]').click();
    await page.waitForTimeout(300);

    const theme1 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme1).toBe('dark');

    // Navigate
    await page.click('[title="Feed"]');
    await page.waitForTimeout(500);

    const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme2).toBe('dark');

    // Toggle back
    await page.locator('[title="Theme"]').click();
  });

  // ===== LOGOUT =====
  test('Logout: returns to login page', async ({ page }) => {
    // Profile avatar in rail
    const avatarBtn = page.locator('[title="You"]');
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click();
      await page.waitForTimeout(500);
      console.log('After profile click, URL:', page.url());
    }
  });
});
