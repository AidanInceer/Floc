import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  { ignores: ["node_modules/**", ".expo/**", "dist/**", "coverage/**", "android/**", "ios/**", "expo-env.d.ts"] },
  ...compat.extends("next/typescript"),

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

  {
    files: ["app/**/*.tsx"],
    rules: { "max-lines-per-function": "off" },
  },

  {
    files: ["metro.config.js", "babel.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
