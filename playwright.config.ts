/**
 * Playwright 設定。
 *
 * - `npm run test:e2e` で `e2e/` 配下の `*.spec.ts` を実行する。
 * - `webServer` で dev server を自動起動 / 再利用。既に `npm run dev` が走っていれば
 *   そちらを使い回し、なければ Playwright が起動する。
 * - MVP では Chromium 1 ブラウザのみ。回帰検知の安定性が必要になったら WebKit / Firefox を追加。
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
