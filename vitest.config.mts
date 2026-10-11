import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./__tests__/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/lib/browser-metrics.ts",
        "src/lib/history.ts",
        "src/lib/ip-detection.ts",
        "src/lib/ip-utils.ts",
        "src/lib/privacy-score.ts",
        "src/lib/schemas.ts",
        "src/lib/share.ts",
        "src/lib/site-url.ts",
        "src/lib/webrtc-diagnostics.ts",
        "src/lib/webrtc-gatherer.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
