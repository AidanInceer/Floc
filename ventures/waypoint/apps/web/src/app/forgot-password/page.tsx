/**
 * /forgot-password — public (#149). Only reachable when mail can actually be
 * sent; `/login` hides the link otherwise (rule 11).
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { RequestResetForm } from "@/components/password-reset-forms";
import { Card, Page, Stack } from "@/components/ui";
import { emailConfigured } from "@/server/email";

export default function ForgotPasswordPage() {
  if (!emailConfigured()) notFound();

  return (
    <Page>
      <Stack gap={6} className="mx-auto max-w-sm pt-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Forgotten password</h1>
          <p className="mt-1 text-sm text-ink-soft">
            We&rsquo;ll send a link to set a new one.
          </p>
        </div>
        <Card className="p-5">
          <RequestResetForm />
        </Card>
        <p className="text-center text-sm text-ink-soft">
          <Link
            href="/login"
            className="text-pen underline underline-offset-2 transition-colors hover:bg-highlight-soft hover:text-pen-deep"
          >
            Back to sign in
          </Link>
        </p>
      </Stack>
    </Page>
  );
}
