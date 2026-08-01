/**
 * /login — public (ticket 05, 19).
 */
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Card, Page, Stack } from "@/components/ui";
import { enabledProviders } from "@/server/auth";

export default function LoginPage() {
  return (
    <Page>
      <Stack gap={6} className="mx-auto max-w-sm pt-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Back to the trip you&rsquo;re planning.
          </p>
        </div>
        <Card className="p-5">
          <AuthForm mode="login" googleEnabled={enabledProviders.google} />
        </Card>
        <p className="text-center text-sm text-ink-soft">
          New to Waypoint?{" "}
          <Link href="/signup" className="text-pen underline">
            Create an account
          </Link>
        </p>
      </Stack>
    </Page>
  );
}
