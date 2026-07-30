/**
 * Generic no-access response (ticket 05): identical wording whether a trip
 * id is real (but not yours) or fake, so ids can't be enumerated by the
 * response text.
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
          This trip either doesn&rsquo;t exist or isn&rsquo;t yours.
        </EmptyState>
      </div>
    </Page>
  );
}
