/**
 * /login — public (ticket 05, 19; redesigned 200).
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { AuthShell, authLinkClass } from "@/components/auth-shell";
import { enabledProviders } from "@/server/auth";
import { emailConfigured } from "@/server/email";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      blurb="Back to the trip you're planning."
      footer={
        <>
          New to Waypoint?{" "}
          <Link href="/signup" className={authLinkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm
        mode="login"
        googleEnabled={enabledProviders.google}
        resetEnabled={emailConfigured()}
      />
    </AuthShell>
  );
}
