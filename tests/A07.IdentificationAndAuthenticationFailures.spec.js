// Playwright test: A07 Identification and Authentication Failures
const { test, expect } = require('@playwright/test');

test.describe('A07: Identification and Authentication Failures', () => {
  const baseUrl = 'http://localhost:3000';
  const lowUser = 'user2';
  const highUser = 'user3';

  test('Low security: 5 failed logins for lowUser, 6th still allowed, error message unchanged, show counter', async ({ page }) => {
    // Set security level to low
    await page.goto(`${baseUrl}/config`);
    await page.waitForTimeout(1000);
    await page.click('button.btn-danger');
    await page.waitForTimeout(1000);
    // Go to login page
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(1000);
    let lastError = '';
    for (let i = 1; i <= 6; i++) {
      await page.fill('#username', lowUser);
      await page.waitForTimeout(500);
      await page.fill('#password', 'wrongpass');
      await page.waitForTimeout(500);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/login/);
      const errorMsg = await page.locator('#login-error').innerText();
      expect(errorMsg).toMatch(/Invalid username or password/);
      lastError = errorMsg;
      console.log(`Attempt ${i}: ${errorMsg}`);
    }
    expect(lastError).toMatch(/Invalid username or password/);
    await page.waitForTimeout(2000);
  });

  test('High security: 5 failed logins for highUser, 6th attempt locked out', async ({ page }) => {
    // Set security level to high
    await page.goto(`${baseUrl}/config`);
    await page.waitForTimeout(1000);
    await page.click('button.btn-success');
    await page.waitForTimeout(1000);
    // Go to login page
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(1000);
    let lastError = '';
    for (let i = 1; i <= 5; i++) {
      await page.fill('#username', highUser);
      await page.waitForTimeout(500);
      await page.fill('#password', 'wrongpass');
      await page.waitForTimeout(500);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/login/);
      const errorMsg = await page.locator('#login-error').innerText();
      expect(errorMsg).toMatch(/Invalid username or password/);
      lastError = errorMsg;
      console.log(`Attempt ${i}: ${errorMsg}`);
    }
    // 6th attempt should be locked out
    await page.fill('#username', highUser);
    await page.waitForTimeout(500);
    await page.fill('#password', 'wrongpass');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
    const errorMsg = await page.locator('#login-error').innerText();
    expect(errorMsg).not.toMatch(/Invalid username or password/);
    expect(errorMsg).toMatch(/locked|Account/);
    console.log(`Attempt 6: ${errorMsg}`);
    await page.waitForTimeout(5000);
  });
});
