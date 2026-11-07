"use client";

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
} = authClient;

/** A fresh read of the session, which re-signs its cookie cache for another `maxAge`. */
export async function renewSessionCache(): Promise<void> {
  const { error } = await authClient.getSession({ query: { disableCookieCache: true } });
  if (error) throw new Error(error.message ?? "Session renewal failed");
}
