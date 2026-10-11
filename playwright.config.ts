import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3126);
const baseURL = `http://127.0.0.1:${port}`;

// Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse a preinstalled Chromium instead
// of the one `npx playwright install chromium` downloads.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    launchOptions: executablePath ? { executablePath } : {},
  },
  // Serves the production build; run `npm run build` first.
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
