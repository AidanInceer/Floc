"use client";

/**
 * Shared login/signup form (ticket 19). Google first when enabled, then
 * email/password — matches ticket 06's primary path (Google + email at
 * launch, Facebook is a fast-follow so it never renders here).
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { signIn, signUp } from "@/lib/auth-client";
import { Button, ErrorText, Field, Input, Stack } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";

const VIA_VALUES = ["whatsapp", "email", "link", "direct"] as const;

export function AuthForm({
  mode,
  googleEnabled,
  captureChannel,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  /** Server Action, signup only: writes signup_channel once (ticket 06). */
  captureChannel?: (via: string) => Promise<void>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/trips";
  const viaParam = params.get("via");
  const via = (VIA_VALUES as readonly string[]).includes(viaParam ?? "")
    ? (viaParam as (typeof VIA_VALUES)[number])
    : null;

  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleGoogle() {
    setError(null);
    const { error: err } = await signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
    if (err) setError(err.message ?? "Could not sign in with Google.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      const { error: err } = await signUp.email({ name, email, password });
      if (err) {
        setError(mapAuthError(err.message));
        return;
      }
      // ensureProfile no-ops if a profile already exists, so this only ever
      // sets signup_channel on the very first sign-up (ticket 06).
      await captureChannel?.(via ?? "direct");
    } else {
      const { error: err } = await signIn.email({ email, password });
      if (err) {
        setError(mapAuthError(err.message));
        return;
      }
    }
    router.push(redirectTo);
  }

  return (
    <Stack gap={4}>
      {googleEnabled ? (
        <>
          <Button variant="secondary" onClick={handleGoogle} className="w-full">
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-rule" />
            or with email
            <span className="h-px flex-1 bg-rule" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={3}>
          {mode === "signup" ? (
            <Field label="Name">
              <Input
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          ) : null}
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <SubmitButton className="w-full">
            {mode === "signup" ? "Create account" : "Sign in"}
          </SubmitButton>
        </Stack>
      </form>
    </Stack>
  );
}

/** Surfaces Better Auth's own messages, with ticket 06's collision case named. */
function mapAuthError(message?: string): string {
  if (!message) return "Something went wrong. Try again.";
  if (/already exists|already registered/i.test(message)) {
    return "An account with this email already exists — sign in the way you originally signed up.";
  }
  return message;
}
