/**
 * /signup — public (ticket 05, 19). Captures ?via= into signup_channel
 * (ticket 06) through an inline Server Action, run once the client-side
 * signUp() call succeeds and a session exists.
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Card, Page, Stack } from "@/components/ui";
import { enabledProviders } from "@/server/auth";
import { getSession } from "@/server/access";
import { ensureProfile } from "@/server/profile";
import type { SignupChannel } from "@/db/schema";

const VIA_VALUES = ["whatsapp", "email", "link", "direct"] as const;

export default function SignupPage() {
  async function captureChannel(via: string) {
    "use server";
    const session = await getSession();
    if (!session?.user) return;
    const channel = (VIA_VALUES as readonly string[]).includes(via)
      ? (via as SignupChannel)
      : "direct";
    await ensureProfile(session.user.id, { signupChannel: channel });
  }

  return (
    <Page>
      <Stack gap={6} className="mx-auto max-w-sm pt-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Create an account</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Takes a minute. No credit card, no app to install.
          </p>
        </div>
        <Card className="p-5">
          <AuthForm
            mode="signup"
            googleEnabled={enabledProviders.google}
            captureChannel={captureChannel}
          />
        </Card>
        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="text-pen underline">
            Sign in
          </Link>
        </p>
      </Stack>
    </Page>
  );
}
