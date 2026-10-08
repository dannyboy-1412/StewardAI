import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @docai/api dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      cwd: '../..',
    },
    {
      command: 'pnpm --filter @docai/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      cwd: '../..',
    },
  ],
})
