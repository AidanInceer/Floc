import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { authSwitchHref } from "@/lib/auth/auth-switch";
import { authMetadata } from "@/lib/seo/public-pages";
import { inviteTokenIn, inviteTrip } from "@/app/invite/[token]/invite-access";
import { getInviteGuest, requireGuest } from "@/server/access";
import { enabledProviders } from "@/server/auth/auth";

type Props = { searchParams: Promise<{ redirect?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { redirect } = await searchParams;
  return authMetadata(
    { path: "/signup", title: "Sign up", description: "Create a free Floc account and start planning your next group trip." },
    redirect,
  );
}

export default async function SignupPage({ searchParams }: Props) {
  await requireGuest();
  const { redirect } = await searchParams;
  const token = inviteTokenIn(redirect);
  const [trip, guest] = await Promise.all([token ? inviteTrip(token) : null, getInviteGuest()]);

  return (
    <AuthShell
      eyebrow={trip?.hostName ? `${trip.hostName} shared a trip` : undefined}
      title={trip ? `Join ${trip.name}` : "Create an account"}
      blurb={guest && trip ? "Your votes and dates come with you." : "Takes a minute. No credit card, no app to install."}
      footer={
        <>
          Already have an account?{" "}
          <Link href={authSwitchHref("/login", redirect)} className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" googleEnabled={enabledProviders.google} />
    </AuthShell>
  );
}
