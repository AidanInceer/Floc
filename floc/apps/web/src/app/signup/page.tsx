/**
 * /signup — public (ticket 05, 19; redesigned 200). Captures ?via= into
 * signup_channel (ticket 06) through a Server Action in `actions.ts`, run once
 * the client-side signUp() call succeeds and a session exists.
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { AuthShell, authLinkClass } from "@/components/auth-shell";
import { enabledProviders } from "@/server/auth/auth";
import { captureChannel } from "./actions";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="First time here"
      title="Create an account"
      blurb="Takes a minute. No credit card, no app to install."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm
        mode="signup"
        googleEnabled={enabledProviders.google}
        captureChannel={captureChannel}
      />
    </AuthShell>
  );
}
