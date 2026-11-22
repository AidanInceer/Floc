import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { DevSignInButton } from "@/components/auth/dev-sign-in-button";
import { authSwitchHref } from "@/lib/auth/auth-switch";
import { authMetadata } from "@/lib/seo/public-pages";
import { requireGuest } from "@/server/access";
import { enabledProviders } from "@/server/auth/auth";
import { listDevAccounts } from "@/server/auth/dev-accounts";
import { emailConfigured } from "@/server/auth/email";

type Props = { searchParams: Promise<{ redirect?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { redirect } = await searchParams;
  return authMetadata(
    { path: "/login", title: "Sign in", description: "Sign in to Floc and get back to planning your trip." },
    redirect,
  );
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect } = await searchParams;
  await requireGuest(redirect);
  const devAccounts = await listDevAccounts();

  return (
    <AuthShell
      title="Sign in"
      blurb="Back to the trip you're planning."
      footer={
        <>
          New to Floc?{" "}
          <Link href={authSwitchHref("/signup", redirect)} className={authLinkClass}>
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
