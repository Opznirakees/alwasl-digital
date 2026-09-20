import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3000';
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const localBrowser = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === 'true'
  ? { channel: 'chrome' as const }
  : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    colorScheme: process.env.E2E_COLOR_SCHEME === 'dark' ? 'dark' : 'light',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === 'true' ? 'off' : 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `PORT=${port} bun run start`,
        url: baseURL,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
        timeout: 120_000,
        env: {
          ...process.env,
          OTP_PEPPER: process.env.OTP_PEPPER ?? 'playwright-only-otp-pepper-for-local-e2e',
          EXPOSE_OTP_IN_RESPONSE: process.env.EXPOSE_OTP_IN_RESPONSE ?? 'true',
          ALLOW_UNDELIVERED_OTP: process.env.ALLOW_UNDELIVERED_OTP ?? 'true',
          ENABLE_FAKE_PAYMENTS: 'false',
          ENABLE_MOCK_WAHO: 'false',
        },
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...localBrowser },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'], ...localBrowser },
    },
  ],
});
