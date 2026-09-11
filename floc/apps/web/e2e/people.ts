import type { Page } from "@playwright/test";

import { SEED_PASSWORD, seedEmail } from "../src/db/seed/identity.ts";

export const priya = {
  email: seedEmail("priya", "a"),
  state: ".e2e/auth/priya.json",
};

export const nadia = {
  email: seedEmail("nadia", "b"),
  state: ".e2e/auth/nadia.json",
};

// Why: Better Auth allows 3 sign-ins per 10 seconds per address in production.
// Sign in once per person in auth.setup.ts and reuse the saved state.
export async function signIn(page: Page, email: string, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
