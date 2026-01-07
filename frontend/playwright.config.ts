/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright E2E Test Configuration for NerdPOS
 *
 * Features:
 * - Multi-browser testing (Chromium, Mobile)
 * - Multi-language support (English, Arabic)
 * - Enhanced reporting (HTML, JSON, JUnit)
 * - Trace/Screenshot/Video on failure for debugging
 * - Tagged test suites for selective execution
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    // Test directory
    testDir: './e2e/tests',

    // Run tests in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry failed tests (more retries on CI due to flakiness)
    retries: process.env.CI ? 2 : 1,

    // Parallel workers
    workers: process.env.CI ? 1 : undefined,

    // Enhanced reporter configuration
    reporter: [
        ['html', { outputFolder: 'e2e/reports/html', open: 'never' }],
        ['json', { outputFile: 'e2e/reports/results.json' }],
        ['junit', { outputFile: 'e2e/reports/junit-results.xml', stripANSIControlSequences: true }],
        ['list', { printSteps: true }],
    ],

    // Global timeout per test
    timeout: 30000,

    // Expect timeout
    expect: {
        timeout: 5000,
    },

    // Shared settings for all projects
    use: {
        // Base URL for the dev server
        baseURL: 'http://localhost:5173',

        // Collect trace on failure (more traces on CI)
        trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',

        // Screenshot settings
        screenshot: 'only-on-failure',

        // Video settings
        video: process.env.CI ? 'retain-on-failure' : 'on-first-retry',

        // Viewport size (POS screen)
        viewport: { width: 1920, height: 1080 },

        // Default locale for testing
        locale: 'en-US',

        // Timezone (Saudi Arabia for business)
        timezoneId: 'Asia/Riyadh',

        // Action timeout
        actionTimeout: 10000,

        // Navigation timeout
        navigationTimeout: 30000,

        // Ignore HTTPS errors for local development
        ignoreHTTPSErrors: !process.env.CI,
    },

    // Configure projects for different scenarios
    projects: [
        {
            name: 'chromium-en',
            use: {
                ...devices['Desktop Chrome'],
                locale: 'en-US',
            },
        },

        // Arabic language testing (RTL support)
        {
            name: 'chromium-ar',
            use: {
                ...devices['Desktop Chrome'],
                locale: 'ar-SA',
            },
        },

        // Mobile POS testing
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 393, height: 851 },
            },
        },

        // Smoke tests only (run first)
        {
            name: 'smoke',
            testMatch: /.*\.spec\.ts/,
            grep: /@smoke/,
            use: {
                ...devices['Desktop Chrome'],
                locale: 'en-US',
            },
        },

        // Business validation tests (separate suite)
        {
            name: 'business-validation',
            testMatch: /business-validation\/.*\.spec\.ts/,
            grep: /@business-validation/,
            use: {
                ...devices['Desktop Chrome'],
                locale: 'en-US',
            },
        },

        // Workflow tests
        {
            name: 'workflows',
            testMatch: /workflows\/.*\.spec\.ts/,
            grep: /@workflow/,
            use: {
                ...devices['Desktop Chrome'],
                locale: 'en-US',
            },
        },
    ],

    // Run local dev server before starting tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
