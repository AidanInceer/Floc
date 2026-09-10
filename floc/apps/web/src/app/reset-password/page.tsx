/**
 * /reset-password — public (#149; redesigned 200). Better Auth sends people
 * here with a one-hour, single-use token in the query.
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { NewPasswordForm } from "@/components/password-reset-forms";
import { AuthShell } from "@/components/auth-shell";
import { emailConfigured } from "@/server/auth/email";

export default function ResetPasswordPage() {
  if (!emailConfigured()) notFound();

  return (
    <AuthShell
      eyebrow="Almost there"
      title="New password"
      blurb="Pick one you haven't used here before."
    >
      <Suspense>
        <NewPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
