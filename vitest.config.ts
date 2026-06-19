import { defineConfig } from "vitest/config";

// Standalone test config (kept separate from vite.config.ts so the React
// compiler / babel build plugins don't run during unit tests).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
  },
});
