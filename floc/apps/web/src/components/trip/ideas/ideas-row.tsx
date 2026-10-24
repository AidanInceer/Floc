// The postcard's way back to the ideas, once the plan has a shape (ideasTucked).
import { sortIdeas, type IdeaRow } from "@floc/core/trip/ideas";
import { Sheet } from "@/components/system/client-ui";
import { ChevronIcon } from "@/components/system/icons";
import { IdeasBoard } from "./ideas-board";

export function IdeasRow({ tripId, ideas }: { tripId: number; ideas: IdeaRow[] }) {
  const [top] = sortIdeas(ideas, "votes");
  if (!top) return null;
  return (
    <Sheet
      bareTrigger
      title="Ideas"
      body="flush"
      keepOpenOnSubmit
      triggerClassName="flex w-full items-center gap-2.5 border-b border-rule py-3 text-left text-sm text-ink-soft hover:text-ink"
      trigger={
        <>
          <BulbIcon />
          <span className="grid min-w-0 flex-1 leading-snug">
            <span className="text-ink">{ideas.length === 1 ? "1 idea" : `${ideas.length} ideas`}</span>
            <span className="truncate text-xs text-ink-faint">Top: {top.title}</span>
          </span>
          <ChevronIcon direction="right" size={13} className="text-ink-faint" />
        </>
      }
    >
      <IdeasBoard tripId={tripId} ideas={ideas} />
    </Sheet>
  );
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-highlight-ink">
      <path d="M5.2 10.2h3.6M5.6 12h2.8M7 1.8a3.6 3.6 0 0 0-2.2 6.4c.4.3.5.7.5 1.1v.9h3.4v-.9c0-.4.1-.8.5-1.1A3.6 3.6 0 0 0 7 1.8Z" />
    </svg>
  );
}
