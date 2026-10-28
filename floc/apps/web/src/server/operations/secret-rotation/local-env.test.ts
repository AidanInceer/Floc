import { expect, it } from "vitest";

import { updateEnvText } from "./local-env";

it("replaces only the values local dev shares with production", () => {
  const text = "TURSO_DATABASE_URL=file:./local.db\nGOOGLE_CLIENT_SECRET=old-google\nSTRIPE_SECRET_KEY=\"sk_test_old\"\nSTRIPE_WEBHOOK_SECRET=whsec_local\n";
  const result = updateEnvText(text, { GOOGLE_CLIENT_SECRET: "new-google", STRIPE_SECRET_KEY: "sk_test_new", STRIPE_WEBHOOK_SECRET: "whsec_prod" });
  expect(result.text).toBe("TURSO_DATABASE_URL=file:./local.db\nGOOGLE_CLIENT_SECRET=new-google\nSTRIPE_SECRET_KEY=sk_test_new\nSTRIPE_WEBHOOK_SECRET=whsec_local\n");
  expect(result.changed).toEqual(["GOOGLE_CLIENT_SECRET", "STRIPE_SECRET_KEY"]);
});

it("adds nothing the local file does not already have", () => {
  const result = updateEnvText("BETTER_AUTH_SECRET=dev\n", { GOOGLE_CLIENT_SECRET: "new-google" });
  expect(result).toEqual({ text: "BETTER_AUTH_SECRET=dev\n", changed: [] });
});

it("skips empty values and values already in place, and keeps Windows line endings", () => {
  const result = updateEnvText("GOOGLE_CLIENT_SECRET=same\r\nSTRIPE_SECRET_KEY=old\r\n", { GOOGLE_CLIENT_SECRET: "same", STRIPE_SECRET_KEY: "" });
  expect(result).toEqual({ text: "GOOGLE_CLIENT_SECRET=same\r\nSTRIPE_SECRET_KEY=old\r\n", changed: [] });
});
