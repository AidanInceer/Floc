/**
 * /reset-password — public (#149). Better Auth sends people here with a
 * one-hour, single-use token in the query.
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { NewPasswordForm } from "@/components/password-reset-forms";
import { Card, Page, Stack } from "@/components/ui";
import { emailConfigured } from "@/server/email";

export default function ResetPasswordPage() {
  if (!emailConfigured()) notFound();

  return (
    <Page>
      <Stack gap={6} className="mx-auto max-w-sm pt-12">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">New password</h1>
        </div>
        <Card className="p-5">
          <Suspense>
            <NewPasswordForm />
          </Suspense>
        </Card>
      </Stack>
    </Page>
  );
}
