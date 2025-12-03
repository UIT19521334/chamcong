// Playwright test: A01 Broken Access Control
const { test, expect } = require('@playwright/test');

test.describe('A01: Broken Access Control', () => {
  const baseUrl = 'http://localhost:3000';
  const lowUser = 'user0';
  const highUser = 'user1';
  const password = 'sample123';

  test('Set security level to low, login with lowUser, expect access to admin', async ({ page }) => {
    // Go to config page
    await page.goto(`${baseUrl}/config`);
    await page.waitForTimeout(1000);
    // Click Low Security button
    await page.click('button.btn-danger');
    await page.waitForTimeout(3000);
    // Go to login page
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(1000);
    await page.fill('#username', lowUser);
    await page.waitForTimeout(1000);
    await page.fill('#password', password);
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    // Expect redirect to home
    await page.waitForURL(`${baseUrl}/home`, { timeout: 5000 });
    await expect(page).toHaveURL(`${baseUrl}/home`);
    await page.waitForTimeout(1000);
    // Try to access /admin
    await page.goto(`${baseUrl}/admin`);
    await page.waitForTimeout(3000);
    // Pass if can access admin page
    await expect(page).toHaveURL(`${baseUrl}/admin`);
  });

  test('Set security level to high, login with highUser, expect redirect to home, /admin forbidden', async ({ page }) => {
    // Go to config page
    await page.goto(`${baseUrl}/config`);
    await page.waitForTimeout(1000);
    // Click High Security button
    await page.click('button.btn-success');
    await page.waitForTimeout(3000);
    // Go to login page
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(1000);
    await page.fill('#username', highUser);
    await page.waitForTimeout(1000);
    await page.fill('#password', password);
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    // Expect redirect to home
    await page.waitForURL(`${baseUrl}/home`, { timeout: 5000 });
    await expect(page).toHaveURL(`${baseUrl}/home`);
    await page.waitForTimeout(1000);
    // Try to access /admin
    await page.goto(`${baseUrl}/admin`);
    await page.waitForTimeout(8000);
    // Pass if redirected back to home
    await expect(page).toHaveURL(`${baseUrl}/home`);
  });
});
