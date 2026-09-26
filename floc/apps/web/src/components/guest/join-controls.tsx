/**
 * The one way in, drawn wherever it is needed (#330) — in the modal that opens
 * on a share link, and in the bar that stays above every page of it.
 *
 * One component rather than two copies: each state a visitor can be in has
 * one right control, and having them in two places is how the two drift.
 *
 * `compact` is the bar's version. Same controls, no explaining sentence — the
 * bar already says what a guest cannot do here.
 */
import { ButtonLink } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";
import { joinTrip } from "@/app/invite/[token]/actions";
import {
  inviteAuthHrefs,
  type InviteViewer,
} from "@/app/invite/[token]/invite-access";

export function JoinControls({
  token,
  viewer,
  full,
  compact,
}: {
  token: string;
  viewer: InviteViewer;
  /** The last join was refused because the trip is at its member ceiling. */
  full?: boolean;
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

  if (full) return <p className="text-sm text-red">This trip is full.</p>;

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
