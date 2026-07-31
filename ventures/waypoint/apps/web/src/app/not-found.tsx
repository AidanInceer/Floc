/**
 * Generic no-access response (ticket 05, extended to profiles by 46):
 * identical wording whether the id is real but not yours, or fake, so ids
 * can't be enumerated by the response text.
 *
 * The copy names no *kind* of thing for the same reason — a trip and a profile
 * a stranger can't reach have to answer identically, or the wording itself
 * says which one exists.
 */
import { ButtonLink, EmptyState, Page } from "@/components/ui";

export default function NotFound() {
  return (
    <Page>
      <div className="pt-16">
        <EmptyState
          title="Nothing here"
          action={<ButtonLink href="/trips">Back to your trips</ButtonLink>}
        >
          This either doesn&rsquo;t exist or isn&rsquo;t yours to see.
        </EmptyState>
      </div>
    </Page>
  );
}
