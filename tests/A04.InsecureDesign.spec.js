// Playwright test: A04 Insecure Design
const { test, expect } = require('@playwright/test');

test.describe('A04: Insecure Design', () => {
    const baseUrl = 'http://localhost:3000';
    const lowUser = 'datndc0';
    const highUser = 'datndc1';
    const password = 'sample123';

    test('Insecure Design: Edit other users posts by changing postId in API request', async ({ page }) => {
        // Set security level to low
        await page.goto(`${baseUrl}/config`);
        await page.waitForTimeout(1000);
        await page.click('button.btn-danger');
        await page.waitForTimeout(1000);

        // Login with datndc/sample123
        await page.goto(`${baseUrl}/login`);
        await page.waitForTimeout(1000);
        await page.fill('#username', lowUser);
        await page.waitForTimeout(1000);
        await page.fill('#password', password);
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        // Navigate to posts page
        await page.goto(`${baseUrl}/posts`);
        await page.waitForTimeout(2000);

        // Intercept API requests to modify postId
        await page.route('/api/posts/**', async route => {
            const request = route.request();
            console.log(`Intercepted request: ${request.method()} ${request.url()}`);

            // If it's a PUT request (edit post), we'll continue with the request
            if (request.method() === 'PUT') {
                console.log('PUT request detected - allowing modification of post');
                await route.continue();
            } else {
                await route.continue();
            }
        });

        // Try to find and click edit button for user's own post first
        const editButtons = await page.locator('button:has-text("Edit"), a:has-text("Edit")').all();
        if (editButtons.length > 0) {
            console.log(`Found ${editButtons.length} edit buttons`);
            await editButtons[0].click();
            await page.waitForTimeout(2000);
        } else {
            console.log('No edit buttons found, trying to create a scenario');
        }

        // Try to manipulate the form to edit post ID 1 (admin0's post)
        const maliciousContent = 'This post has been edited by dat - demonstrating insecure design vulnerability!';

        // Fill the title field
        await page.fill('input[name="title"], #title', 'Modified by unauthorized user');
        await page.waitForTimeout(500);

        // Fill the content field
        await page.fill('textarea[name="content"], #content', maliciousContent);
        await page.waitForTimeout(500);

        // Click the submit button with ID submit-postid-1
        await page.click('#submit-postid-1');
        await page.waitForTimeout(3000);

        console.log('Clicked submit button for post ID 1');

        // Scroll down to see the results
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(5000);

        // Look for the title we just entered in the current page
        const titleVisible = await page.locator('text=Modified by unauthorized user').isVisible();
        if (titleVisible) {
            console.log('VULNERABILITY CONFIRMED: Title found on current page - edit successful');
        } else {
            console.log('Title not immediately visible, checking page content');
        }
    });

    test('Verify proper authorization prevents unauthorized post editing', async ({ page }) => {
        // This test should verify that proper security measures prevent the above attack

        // Set security level to high
        await page.goto(`${baseUrl}/config`);
        await page.waitForTimeout(1000);
        await page.click('button.btn-success');
        await page.waitForTimeout(1000);

        // Login with dat/sample123
        await page.goto(`${baseUrl}/login`);
        await page.waitForTimeout(1000);
        await page.fill('#username', highUser);
        await page.waitForTimeout(1000);
        await page.fill('#password', password);
        await page.waitForTimeout(1000);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        // Navigate to posts page
        await page.goto(`${baseUrl}/posts`);
        await page.waitForTimeout(2000);

        // Try to manipulate the form to edit post ID 1 (admin0's post)
        const maliciousContent = 'This post has been edited in HIGH security - should be blocked!';

        // Fill the title field
        await page.fill('input[name="title"], #title', 'Unauthorized edit attempt HIGH');
        await page.waitForTimeout(500);

        // Fill the content field
        await page.fill('textarea[name="content"], #content', maliciousContent);
        await page.waitForTimeout(500);

        // Click the submit button with ID submit-postid-1
        await page.click('#submit-postid-1');
        await page.waitForTimeout(3000);

        console.log('Clicked submit button for post ID 1 in HIGH security mode');
        
        // Look for error messages that indicate the edit was blocked
        const errorMessage = 'Access denied! You can only edit your own posts.';

        let errorFound = false;
        const errorVisible = await page.locator(`text=${errorMessage}`).isVisible();
        if (errorVisible) {
            console.log(`GOOD: Error message found - "${errorMessage}" - edit was blocked`);
            errorFound = true;
        }
        
        if (!errorFound) {
            // Check the page content for any error indicators
            const pageContent = await page.content();
            if (pageContent.includes('error') || pageContent.includes('denied') || pageContent.includes('unauthorized')) {
                console.log('GOOD: Error content found in page - edit appears to be blocked');
                errorFound = true;
            }
        }
    });
});
