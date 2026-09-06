import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  { ignores: ["node_modules/**", "coverage/**"] },
  ...compat.extends("next/typescript"),

  // Same ceilings as everywhere else (#212).
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", 15],
    },
  },

  // A router is one `t.router({...})` call, so every procedure counts as one
  // function body. Splitting on the line count would split the contract.
  {
    files: ["src/routers/*.ts"],
    rules: { "max-lines-per-function": "off" },
  },

  {
    files: ["src/**/*.test.ts"],
    rules: { "max-lines": "off", "max-lines-per-function": "off", complexity: "off" },
  },
];

export default config;
