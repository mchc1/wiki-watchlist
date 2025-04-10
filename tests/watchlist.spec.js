import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const STORAGE_STATE_PATH = path.resolve('./.auth/storageState.json');
const user = process.env.WIKI_USER;

test.describe.serial('Wikipedia Watchlist Flow', () => {
  // not optimal to have serial - quick fix to remove flakiness for sake of time, but with more time might choose to use 1) isolated users per test / different storageState files, or 2) create new browser context per test
  const article1 = 'Bread';
  const article2 = 'Playwright (software)';

  test.use({ storageState: STORAGE_STATE_PATH });

  test.afterEach(async ({ browser }) => {
    // Clear the watchlist after each test
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
      console.warn(`[afterEach] Storage state file not found at ${STORAGE_STATE_PATH}. Skipping watchlist cleanup.`);
      return;
    }

    const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const page = await context.newPage();

    try {
      await page.goto('https://en.wikipedia.org/wiki/Special:EditWatchlist/clear');
      await page.getByRole('button', { name: /Clear the watchlist/ }).click();
      await expect(page.locator('#mw-content-text')).toContainText('Your watchlist has been cleared.');
      console.log('[afterEach] Watchlist cleared.');
    } catch (error) {
      console.error('[afterEach] Error clearing watchlist:', error);
    } finally {
      await context.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    // Check if state file exists before trying to use it
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
      console.warn(`[afterAll] Storage state file not found at ${STORAGE_STATE_PATH}. Skipping cleanup.`);
      return;
    }
    
    const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    const page = await context.newPage();

    try {   
      // Log out
      await page.goto('https://en.wikipedia.org/wiki/Main_Page');
      await page.getByRole('button', { name: 'Personal tools' }).check();
      await page.getByRole('link', { name: 'Log out' }).click();

      // Verify logout success
      await expect(page.locator('#firstHeading')).toHaveText('Log out');
      console.log('[afterAll] Logged out successfully.');

    } catch(error) {
        console.error("[afterAll] Error during logout:", error);
    } finally {
        await context.close();
        console.log('[afterAll] Cleanup complete.');
    }
  });

  test('Add two pages to Watchlist and verify', async ({ page }) => {
    console.log('[Test 1] Adding articles to watchlist...');

    // Add article1
    await page.goto(`https://en.wikipedia.org/wiki/${article1}`);
    await page.locator('#ca-watch').click();
    await expect(page.locator('#ca-unwatch')).toBeVisible(); // Verify it changed to 'Unwatch'
    console.log(`[Test 1] Added "${article1}" to watchlist.`);

    // Add article2
    await page.goto(`https://en.wikipedia.org/wiki/${article2}`);
    await page.locator('#ca-watch').click();
    await expect(page.locator('#ca-unwatch')).toBeVisible(); // Verify it changed to 'Unwatch'
    console.log(`[Test 1] Added "${article2}" to watchlist.`);

    // Verify both articles are on the watchlist page
    await page.goto('https://en.wikipedia.org/wiki/Special:EditWatchlist');
    await expect(page.getByRole('checkbox', { name: `${article1} (talk | history)` })).toHaveCount(1);
    await expect(page.getByRole('checkbox', { name: `${article2} (talk | history)` })).toHaveCount(1);
    console.log('[Test 1] Verified both articles are in the watchlist.');
  });

  test('Remove one article from Watchlist and verify', async ({ page }) => {
    console.log('[Test 2] Removing an article from watchlist...');

    // Setup: Ensure both articles are in the watchlist
    console.log(`[Test 2] Pre-adding articles to watchlist...`);
    await page.goto(`https://en.wikipedia.org/wiki/Special:EditWatchlist/raw`);
    await page.locator('#ooui-php-2').fill(`${article1}\n${article2}`); // text box for editing list
    await page.getByRole('button', { name: 'Update watchlist' }).click();
    console.log('[Test 2] Pre-test setup complete.');

    // Remove article2
    await page.goto('https://en.wikipedia.org/wiki/Special:EditWatchlist');
    // await page.getByRole('checkbox', { name: `${article2} (talk | history)` }).check(); // flaky, replaced with the following 3 lines:
    const article2Checkbox = page.getByRole('checkbox', { name: `${article2} (talk | history)` });
    await expect(article2Checkbox).toBeVisible();
    await article2Checkbox.check();
    await page.getByRole('button', { name: 'Remove titles' }).click();

    await expect(page.locator('#mw-content-text')).toContainText('A single title was removed from your watchlist');
    await expect(page.locator('#mw-content-text')).toContainText(article2);
    console.log(`[Test 2] Removed "${article2}" and confirmed message.`);

    // Verify article2 is gone, and article1 remains on the list
    await page.goto('https://en.wikipedia.org/wiki/Special:EditWatchlist');
    await expect(page.getByRole('checkbox', { name: `${article2} (talk | history)` })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: `${article1} (talk | history)` })).toHaveCount(1);
    console.log(`[Test 2] Verified "${article1}" is still in the watchlist.`);
  });

  test('Verify article title matches link in watchlist', async ({ page }) => {
    console.log('[Test 3] Verifying title of article from watchlist...');

    // Setup: Ensure article1 is in the watchlist
    console.log(`[Test 3] Pre-adding ${article1} to watchlist...`);
    await page.goto(`https://en.wikipedia.org/wiki/Special:EditWatchlist/raw`);
    await page.locator('#ooui-php-2').fill(article1);
    await page.getByRole('button', { name: 'Update watchlist' }).click();

    // Verify title on article page matches watchlist link
    await page.goto('https://en.wikipedia.org/wiki/Special:EditWatchlist');
    const article1Link = page.getByRole('link', { name: article1, exact: true });
    await expect(article1Link).toBeVisible();
    await article1Link.click();
    await expect(page.locator('#firstHeading')).toHaveText(article1);
    console.log('[Test 3] Verified article title matches watchlist link.');
  });

});

// End! Thank you for reading.