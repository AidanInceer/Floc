/**
 * /forgot-password — public (#149; redesigned 200). Only reachable when mail
 * can actually be sent; `/login` hides the link otherwise (rule 11).
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { RequestResetForm } from "@/components/password-reset-forms";
import { AuthShell, authLinkClass } from "@/components/auth-shell";
import { emailConfigured } from "@/server/auth/email";

export default function ForgotPasswordPage() {
  if (!emailConfigured()) notFound();

  return (
    <AuthShell
      eyebrow="Locked out"
      title="Forgotten password"
      blurb="We'll send a link to set a new one."
      footer={
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      <RequestResetForm />
    </AuthShell>
  );
}
