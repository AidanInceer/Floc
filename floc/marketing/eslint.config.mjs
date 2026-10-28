import tseslint from "typescript-eslint";

const config = [
  { ignores: ["node_modules/**", "coverage/**", "studio/**", "content/**", "eslint.config.mjs"] },

  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/require-array-sort-compare": "error",
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true }],
      complexity: ["warn", 15],
    },
  },
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];

export default config;
