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
