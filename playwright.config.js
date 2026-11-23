const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./frontend/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5500",
    browserName: "chromium",
    headless: true
  },
  webServer: {
    command: "node backend/tests/e2e-server.js",
    url: "http://127.0.0.1:5500",
    reuseExistingServer: false,
    timeout: 180000
  }
});
