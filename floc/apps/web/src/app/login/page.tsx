/**
 * /login — public (ticket 05, 19; redesigned 200).
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { DevSignInButton } from "@/components/auth/dev-sign-in-button";
import { requireGuest } from "@/server/access";
import { enabledProviders } from "@/server/auth/auth";
import { listDevAccounts } from "@/server/auth/dev-accounts";
import { emailConfigured } from "@/server/auth/email";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await requireGuest((await searchParams).redirect);
  const devAccounts = await listDevAccounts();

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      blurb="Back to the trip you're planning."
      footer={
        <>
          New to Floc?{" "}
          <Link href="/signup" className={authLinkClass}>
            Create an account
          </Link>
          {devAccounts.length > 0 ? (
            <div className="mt-6">
              <DevSignInButton accounts={devAccounts} />
            </div>
          ) : null}
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
