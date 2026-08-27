import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      // D3 gate: 80% branch on shared/domain only (pure business logic).
      include: ["src/shared/domain/**"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
  },
});
