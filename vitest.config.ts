import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Neon's direct connection has real cold-start latency (each test in the
    // integration suite opens fresh connections for a multi-step transaction
    // flow). 5s default is fine for pure-logic tests but too tight here.
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
