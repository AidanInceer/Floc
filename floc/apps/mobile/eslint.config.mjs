import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * The repo's own config, not `eslint-config-expo` (ticket 289).
 *
 * `next/typescript` is what every other package here already uses, and the
 * rules that matter — unused vars, hooks, exhaustive deps — are the same ones.
 *
 * NO BRACES IN A GLOB. A pattern like "dot-ts-or-tsx" in brace form sends
 * ESLint through `minimatch@3`'s
 * `braceExpand`, which the `brace-expansion: ^5.0.9` security pin in
 * pnpm-workspace.yaml breaks outright ("expand is not a function") — ESLint
 * dies before it lints a line, and the stack names neither the config nor the
 * pin. The security gates are fixed and never weakened, so the glob is what
 * gives: list the extensions separately. Every other package here happens to
 * avoid braces already, which is why this only ever bites a new one.
 */
const config = [
  { ignores: ["node_modules/**", ".expo/**", "dist/**", "coverage/**", "android/**", "ios/**", "expo-env.d.ts"] },
  ...compat.extends("next/typescript"),

  // The same ceilings as the web app and the packages (#212) — the platform
  // changed, the limits did not.
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", 15],
    },
  },

  // A screen is one component, and its JSX return is the bulk of it — the same
  // exemption `apps/web` gives a page.
  {
    files: ["app/**/*.tsx"],
    rules: { "max-lines-per-function": "off" },
  },

  // Metro and Babel load their config with `require()`; they are CommonJS by
  // contract, not by preference.
  {
    files: ["metro.config.js", "babel.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
