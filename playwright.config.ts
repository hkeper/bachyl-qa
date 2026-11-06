import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const isCI = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * Two kinds of tests run against one Bachyl server:
 * - `api`: HTTP only, no browser. Contracts, status codes, negative cases.
 * - `ai-eval`: unit tests of the accuracy metrics (no server needed).
 * - `web-*`: the React app in a browser. The scan endpoint is mocked per test
 *   (src/fixtures/mocks.ts), so UI states don't depend on the AI's answer.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: isCI
    ? [["list"], ["html", { open: "never" }], ["github"], ["junit", { outputFile: "test-results/junit.xml" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "api",
      testDir: "./tests/api",
      use: { extraHTTPHeaders: { Accept: "application/json" } },
    },
    {
      // Pure unit tests of the evaluation maths: no server, no browser.
      name: "ai-eval",
      testDir: "./tests/ai-eval",
    },
    {
      name: "web-chromium",
      testDir: "./tests/web",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "web-firefox",
      testDir: "./tests/web",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "web-webkit",
      testDir: "./tests/web",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "web-mobile",
      testDir: "./tests/web",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
