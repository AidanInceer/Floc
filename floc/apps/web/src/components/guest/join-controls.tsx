/**
 * The one way in, drawn wherever it is needed (#330) — in the modal that opens
 * on a share link, and in the bar that stays above every page of it.
 *
 * One component rather than two copies: the four states a visitor can be in
 * (stranger, unverified inbox, ready to join, already a member) each have one
 * right control, and having them in two places is how the two drift.
 *
 * `compact` is the bar's version. Same controls, no explaining sentence — the
 * bar already says what a guest cannot do here.
 */
import { ButtonLink } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import { joinTrip, resendVerification } from "@/app/invite/[token]/actions";
import {
  inviteAuthHrefs,
  type InviteViewer,
} from "@/app/invite/[token]/invite-access";

export function JoinControls({
  token,
  viewer,
  verifyState,
  compact,
}: {
  token: string;
  viewer: InviteViewer;
  /** `?verify=sent` after a resend, so the notice can say it went. */
  verifyState?: string;
  compact?: boolean;
}) {
  const { signUpHref, signInHref } = inviteAuthHrefs(token);

  if (viewer.kind === "stranger") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink variant="primary" href={signUpHref}>
          Sign up to join
        </ButtonLink>
        <ButtonLink variant="secondary" href={signInHref}>
          I have an account
        </ButtonLink>
      </div>
    );
  }

  if (viewer.kind === "unverified") {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-ink-soft">
          {verifyState === "sent"
            ? `We've sent a confirmation link to ${viewer.email}. Open it, then come back to join.`
            : `Confirm your email first — we sent a link to ${viewer.email} when you signed up.`}
        </p>
        <form action={resendVerification.bind(null, token)}>
          <SubmitButton variant="secondary" pendingLabel="Sending…">
            Resend confirmation
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={joinTrip.bind(null, token)}>
        <SubmitButton pendingLabel="Joining…">Join this trip</SubmitButton>
      </form>
      {compact ? null : (
        <p className="text-sm text-ink-soft">
          Joining puts you in the group. You can leave at any time.
        </p>
      )}
    </div>
  );
}
