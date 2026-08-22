import { defineConfig } from "astro/config";

const base = process.env.PAGES_BASE_PATH || "/";

export default defineConfig({
  site: "https://agentprofile.org",
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "never",
  },
});
