import { defineConfig } from "@playwright/test";

const node = "/Users/chan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";
const vite = "/Users/chan/Desktop/gongbu/stockwellness-project/stockwellness-front/node_modules/vite/bin/vite.js";

export default defineConfig({
  testDir: "./tests",
  testMatch: "actual-investment.mock.e2e.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/actual-investment-mock",
  use: { baseURL: "http://127.0.0.1:5173", browserName: "chromium", screenshot: "only-on-failure" },
  projects: [
    { name: "mobile-360", use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `${node} ${vite} --host 127.0.0.1`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
