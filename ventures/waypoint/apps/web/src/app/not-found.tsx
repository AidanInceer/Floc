/**
 * Generic no-access response (ticket 05, extended to profiles by 46;
 * redesigned 202): identical wording whether the id is real but not yours, or
 * fake, so ids can't be enumerated by the response text.
 *
 * The copy names no *kind* of thing for the same reason — a trip and a profile
 * a stranger can't reach have to answer identically, or the wording itself
 * says which one exists. That is why there is no "back to the trip" here, only
 * ways back into the product at large.
 */
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <p className="typed">Nothing here</p>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)]">
        This page has no answer for you
      </h1>
      <p className="mx-auto mt-4 max-w-[48ch] text-sm text-ink-soft">
        It either doesn&rsquo;t exist or isn&rsquo;t yours to see. If someone sent you a
        link, ask them to check it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink variant="primary" href="/trips">
          Your trips
        </ButtonLink>
        <ButtonLink variant="secondary" href="/explore">
          Explore
        </ButtonLink>
      </div>
    </div>
  );
}
