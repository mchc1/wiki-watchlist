// global-setup.js
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config(); // Load environment variables

// Define path where state will be saved
const STORAGE_STATE_PATH = path.resolve('./.auth/storageState.json');
const user = process.env.WIKI_USER;
const pass = process.env.WIKI_PASS;

async function globalSetup() { // The function Playwright will run
    console.log('\n--- Starting Global Setup ---');
    if (!user || !pass) {
        throw new Error('WIKI_USER or WIKI_PASS environment variables are not set for global setup.');
    }

    console.log('Launching browser for setup...');
    const browser = await chromium.launch();
    const context = await browser.newContext(); // Create a clean context
    const page = await context.newPage();
    console.log('Browser context and page created.');

    try {
        console.log('Navigating to Wikipedia...');
        await page.goto('https://en.wikipedia.org/');
        await page.getByRole('link', { name: 'Log in' }).click();
        console.log('Filling login form...');
        await page.locator('#wpName1').fill(user);
        await page.locator('#wpPassword1').fill(pass);
        await page.getByRole('button', { name: 'Log in' }).click();
        console.log('Login submitted.');

        // Wait reliably for login confirmation before saving state
        console.log('Waiting for user link to confirm login...');
        await page.locator(`#pt-userpage-2 a:has-text("${user}")`).waitFor({ state: 'visible', timeout: 15000 }); // Increased timeout slightly
        console.log(`Login successful for user: ${user}`);

        console.log(`Saving storage state to: ${STORAGE_STATE_PATH}`);
        const dir = path.dirname(STORAGE_STATE_PATH);
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        await page.context().storageState({ path: STORAGE_STATE_PATH });
        console.log(`Storage state saved successfully.`);

        if (!fs.existsSync(STORAGE_STATE_PATH)) {
            throw new Error(`Failed to save storage state to ${STORAGE_STATE_PATH}`);
        }
        console.log('Verified storage state file exists.');

    } catch (error) {
        console.error("ERROR during Global Setup:", error);
        await page.screenshot({ path: 'global-setup-error.png' });
        throw error; // Fail the entire test run if setup fails
    } finally {
        console.log('Closing browser used for setup...');
        await browser.close(); // Clean up the browser instance
        console.log('Browser closed.');
    }
    console.log('--- Global Setup Finished ---');
}

export default globalSetup; // Export the setup function