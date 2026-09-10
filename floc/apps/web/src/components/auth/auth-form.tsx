"use client";

/**
 * Shared login/signup form (ticket 19). Google first when enabled, then
 * email/password — matches ticket 06's primary path (Google + email at
 * launch, Facebook is a fast-follow so it never renders here).
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { signIn, signUp } from "@/lib/auth-client";
import { isValidEmail, passwordWeakness } from "@floc/core/text/credentials";
import { Button, ErrorText, Field, Input, Stack } from "@/components/system/ui";

const VIA_VALUES = ["whatsapp", "email", "link", "direct"] as const;

export function AuthForm({
  mode,
  googleEnabled,
  resetEnabled,
  captureChannel,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  /** Reset needs mail; without it the link would lead nowhere (rule 11). */
  resetEnabled?: boolean;
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

  const justReset = params.get("reset") === "1";

  const [error, setError] = useState<string | null>(null);
  // The form submits through Better Auth's browser client, not a form action,
  // so `useFormStatus` never sees it — pending is tracked here instead, and it
  // is what stops a second submission (ticket 200).
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Rule 11: hidden in production when Google isn't configured. Shown in dev
  // regardless so the button can be previewed before keys exist (ticket 149).
  const showGoogle = googleEnabled || process.env.NODE_ENV !== "production";

  async function handleGoogle() {
    if (busy) return;
    setError(null);
    if (!googleEnabled) {
      setError("Google sign-in isn't set up yet — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
      return;
    }
    setBusy(true);
    const { error: err } = await signIn.social({
      provider: "google",
      callbackURL: redirectTo,
    });
    if (err) {
      setBusy(false);
      setError(mapGoogleError(err.code, err.message));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!isValidEmail(email)) {
      setError("That doesn't look like an email address.");
      return;
    }
    // Strength is only enforced on the way in, not on an existing password.
    if (mode === "signup") {
      const weak = passwordWeakness(password);
      if (weak) {
        setError(weak);
        return;
      }
    }

    setBusy(true);
    if (mode === "signup") {
      const { error: err } = await signUp.email({ name, email, password });
      if (err) {
        setBusy(false);
        setError(mapAuthError(err.message));
        return;
      }
      // ensureProfile no-ops if a profile already exists, so this only ever
      // sets signup_channel on the very first sign-up (ticket 06).
      await captureChannel?.(via ?? "direct");
    } else {
      const { error: err } = await signIn.email({ email, password });
      if (err) {
        setBusy(false);
        setError(mapSignInError(err.message, googleEnabled));
        return;
      }
    }
    // Without the refresh the header stays signed out: the root layout is a
    // Server Component, and the router cache would replay the payload it
    // rendered before the session cookie existed. Matches SignOutButton.
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Stack gap={4}>
      {justReset ? (
        <p className="rounded-md bg-mint px-3 py-2 text-sm text-mint-ink">
          Your password is set. Sign in with it.
        </p>
      ) : null}
      {showGoogle ? (
        <>
          <GoogleButton
            onClick={handleGoogle}
            disabled={busy}
            label={mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          />
          <div className="typed flex items-center gap-3 text-ink-faint">
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
                name="name"
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
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" hint={mode === "signup" ? "At least 8 characters, with a letter and a number." : undefined}>
            <Input
              type="password"
              required
              name="password"
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {mode === "login" && resetEnabled ? (
            <Link
              href="/forgot-password"
              className="-mt-1 self-start text-xs text-ink-soft underline underline-offset-2 hover:text-pen"
            >
              Forgotten your password?
            </Link>
          ) : null}
          <ErrorText>{error}</ErrorText>
          <Button
            type="submit"
            variant="primary"
            disabled={busy}
            className="w-full"
          >
            {busy
              ? mode === "signup"
                ? "Creating…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

/**
 * Google's own sign-in button (ticket 149): the four-colour "G" mark on a
 * white face with a grey rule, per Google's branding guidelines. Kept in this
 * file because it's the only place a provider button renders.
 */
function GoogleButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // Google's own hexes, and the one place a literal is allowed past the
      // token rule (ticket 206): the button and the mark are prescribed by
      // Google's branding guidelines and are not ours to repaint.
      className="lift flex w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1f1f1f] disabled:pointer-events-none disabled:opacity-50"
    >
      <GoogleG />
      {label}
    </button>
  );
}

/** Google's official four-colour "G" logo. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Sign-up: the collision case named (ticket 06). */
function mapAuthError(message?: string): string {
  if (!message) return "Something went wrong. Try again.";
  if (/already exists|already registered/i.test(message)) {
    return "An account with this email already exists — sign in instead.";
  }
  return message;
}

/**
 * Sign-in (#149). A wrong password and an account that only has Google look
 * identical from here, and must stay that way — naming which it was would let
 * anyone test whether an address is registered. So the hint covers both
 * without confirming either.
 */
function mapSignInError(message: string | undefined, googleEnabled: boolean): string {
  if (message && !/invalid|incorrect|not found|password/i.test(message)) {
    return message;
  }
  return googleEnabled
    ? "That email and password don't match. If you signed up with Google, use the Google button above."
    : "That email and password don't match.";
}

/** The linking refusals, which otherwise surface as raw codes (#149). */
function mapGoogleError(code?: string, message?: string): string {
  if (code === "ACCOUNT_NOT_LINKED" || /not linked/i.test(message ?? "")) {
    return "This email already has an account here. Sign in with your password, then link Google from your account settings.";
  }
  return message ?? "Could not sign in with Google.";
}
