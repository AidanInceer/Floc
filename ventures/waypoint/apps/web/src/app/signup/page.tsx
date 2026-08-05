/**
 * /signup — public (ticket 05, 19). Captures ?via= into signup_channel
 * (ticket 06) through a Server Action in `actions.ts`, run once the client-side
 * signUp() call succeeds and a session exists.
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Card, Page, Stack } from "@/components/ui";
import { enabledProviders } from "@/server/auth";
import { captureChannel } from "./actions";

export default function SignupPage() {
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
          <Link href="/login" className="text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep">
            Sign in
          </Link>
        </p>
      </Stack>
    </Page>
  );
}
