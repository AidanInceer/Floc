import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  { ignores: ["node_modules/**", "coverage/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { settings: { next: { rootDir: "." } }, rules: { "@next/next/no-html-link-for-pages": "off" } },

  // Same ceilings as everywhere else (#212).
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", 15],
    },
  },

  {
    files: ["src/**/*.test.ts"],
    rules: { "max-lines": "off", "max-lines-per-function": "off", complexity: "off" },
  },
];

export default config;
