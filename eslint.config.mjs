import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "e2e/**",
  ]),
  {
    // Feature-boundary rules (decision #15): cross-feature imports only via barrels.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message:
                "Do not deep-import feature internals. Import from the feature's index barrel only.",
            },
          ],
        },
      ],
    },
  },
  {
    // The builder's ai/ sub-module (src/features/builder/ai) is SERVER-ONLY —
    // the feature barrel must stay client-safe (the page imports it), so it
    // cannot re-export the handler. These files may deep-import its internals;
    // external consumers still go through the barrel.
    files: [
      "src/features/builder/ai/**/*.{ts,tsx}",
      "src/app/api/ai-design/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
