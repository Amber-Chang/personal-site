import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Node.js runtime globals available to the CommonJS tool scripts. Listed inline so the
// lint config does not depend on a transitive package.
const nodeGlobals = Object.fromEntries(
  [
    "AbortController",
    "Buffer",
    "TextDecoder",
    "TextEncoder",
    "URL",
    "URLSearchParams",
    "__dirname",
    "__filename",
    "clearImmediate",
    "clearInterval",
    "clearTimeout",
    "console",
    "fetch",
    "global",
    "process",
    "queueMicrotask",
    "setImmediate",
    "setInterval",
    "setTimeout",
    "structuredClone",
  ].map((name) => [name, "readonly"]),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `.cjs` files are standalone Node.js CommonJS tools (gates/, loops/, onboarding/),
  // not Next.js app code: `require()` is the correct import style there and a local
  // variable named `module` is harmless. Keep `no-undef` on so typos still fail lint.
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: nodeGlobals,
      sourceType: "commonjs",
    },
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
