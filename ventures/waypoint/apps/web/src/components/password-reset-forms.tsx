"use client";

/**
 * The two halves of password reset (#149): ask for a link, then set the new
 * password. Both are client components because Better Auth's browser client
 * owns the call and the session cookie it sets.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { requestPasswordReset, resetPassword } from "@/lib/auth-client";
import { isValidEmail, passwordWeakness } from "@/lib/credentials";
import { Button, ErrorText, Field, Input, Stack } from "@/components/ui";

export function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("That doesn't look like an email address.");
      return;
    }

    setBusy(true);
    const { error: err } = await requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setBusy(false);

    // Success either way: saying "no such account" would let anyone test which
    // addresses are registered.
    if (err && err.status !== 404) {
      setError("Something went wrong. Try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-ink-soft">
        If that address has an account, a reset link is on its way. It expires
        within the hour.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={3}>
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </Stack>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Better Auth bounces an expired or spent token back here with `?error=`.
  if (!token || linkError) {
    return (
      <Stack gap={3}>
        <p className="text-sm text-ink-soft">
          That link has expired or has already been used.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-pen underline underline-offset-2 hover:text-pen-deep"
        >
          Send a new one
        </Link>
      </Stack>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const weak = passwordWeakness(password);
    if (weak) {
      setError(weak);
      return;
    }

    setBusy(true);
    const { error: err } = await resetPassword({ newPassword: password, token: token! });
    setBusy(false);

    if (err) {
      setError("That link has expired or has already been used.");
      return;
    }
    router.push("/login?reset=1");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={3}>
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Saving…" : "Set new password"}
        </Button>
      </Stack>
    </form>
  );
}
