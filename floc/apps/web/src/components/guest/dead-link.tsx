/**
 * A link that has been replaced, or belongs to a trip that no longer exists.
 *
 * Its own answer rather than the generic not-found: the token is a random
 * UUID, so saying "this link no longer works" reveals nothing an attacker could
 * enumerate, and a stranger holding a stale link deserves to know which of the
 * two problems they have (#381).
 */
import { ButtonLink, PageTitle } from "@/components/system/ui";

export function DeadLink() {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <PageTitle>This link no longer works</PageTitle>
      <p className="mx-auto mt-4 max-w-[48ch] text-md text-ink-soft">
        The trip may have been deleted, or the invite link replaced. Ask whoever
        sent it for a fresh one — a new link takes them a moment to make.
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
