/**
 * A link that has run out or been replaced, or belongs to a trip that no longer exists.
 *
 * Its own answer rather than the generic not-found: the token is a random
 * UUID, so saying "this link no longer works" reveals nothing an attacker could
 * enumerate, and a stranger holding a stale link deserves to know which of the
 * two problems they have (#381).
 */
import { INVITE_LINK_DAYS } from "@floc/core/trip/group/invite-link";

import { ButtonLink, PageTitle } from "@/components/system/ui";

export function DeadLink() {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <PageTitle>This link no longer works</PageTitle>
      <p className="mx-auto mt-4 max-w-[48ch] text-pretty text-md text-ink-soft">
        An invite link works for {INVITE_LINK_DAYS} days. This one may have run out or been replaced, or the
        trip may have been deleted. Ask whoever sent it for a fresh one. A new link takes them a moment to make.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink variant="primary" href="/">
          What Floc is
        </ButtonLink>
        <ButtonLink variant="secondary" href="/trips">
          Your own trips
        </ButtonLink>
      </div>
    </div>
  );
}
