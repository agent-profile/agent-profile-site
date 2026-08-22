import { defineConfig, devices } from "@playwright/test";

const configuredBasePath = process.env.TEST_BASE_PATH || "/";
const basePath =
  configuredBasePath === "/"
    ? ""
    : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "site.spec.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:4321${basePath}/`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run preview",
    env: {
      HOST: "127.0.0.1",
      PORT: "4321",
      TEST_BASE_PATH: configuredBasePath,
    },
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
