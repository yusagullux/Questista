import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Stylistic — apostrophes in JSX text render fine. Disabled for ergonomics.
      "react/no-unescaped-entities": "off",
      // The Supabase result layer is intentionally untyped until we generate
      // types from the schema; keep visibility without blocking the build.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;