import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const webRoot = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: webRoot });

const config = [
  { settings: { next: { rootDir: webRoot } } },
  {
    ignores: [
      ".next/**",
      ".next-verify/**",
      ".e2e/**",
      "node_modules/**",
      "next-env.d.ts",
      "drizzle/**",
      "coverage/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "max-lines": [
        "warn",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["warn", 15],
    },
  },

  {
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    rules: { "max-lines-per-function": "off" },
  },

  {
    files: [
      "src/components/auth/auth-form.tsx",
      "src/components/days/days-calendar.tsx",
      "src/components/money/expense-form.tsx",
      "src/components/social/place-picker.tsx",
      "src/server/itinerary/weather.ts",
    ],
    rules: { "max-lines-per-function": "off", complexity: "off" },
  },
  {
    files: [
      "src/app/trip/[[]id]/dates/page.tsx",
      "src/app/trip/[[]id]/money/page.tsx",
    ],
    rules: { complexity: "off" },
  },

  {
    files: ["src/db/schema.ts"],
    rules: { "max-lines": "off" },
  },

  {
    files: ["src/**/*.test.ts", "src/test/**"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      complexity: "off",
    },
  },
];

export default config;
