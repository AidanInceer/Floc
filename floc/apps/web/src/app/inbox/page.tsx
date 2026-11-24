import { commentTime } from "@floc/core/notes/notes";
import { groupByTrip, lineUnderTrip, planFirst } from "@floc/core/notifications/by-trip";

import { openNotification, readEverything, seeInbox } from "./actions";
import { requireUser } from "@/server/access";
import { countUnread, listInbox, type InboxItem } from "@/server/notifications/inbox";
import { AccountPage, Panel } from "@/components/auth/account-ui";
import { ChangeWords } from "@/components/notifications/change-words";
import { SeenOnLanding } from "@/components/notifications/seen-on-landing";
import { SubmitButton } from "@/components/system/client-ui";
import { Badge, ButtonLink, EmptyState, cx } from "@/components/system/ui";

export const metadata = { title: "Inbox" };

function InboxLine({ item }: { item: InboxItem }) {
  return (
    <span className="min-w-0">
      <span className={cx("block text-sm transition-colors group-hover:text-pen-deep", item.read ? "text-ink-2" : "text-ink")}>
        {lineUnderTrip(item.text, item.tripName)}
      </span>
      {item.words ? <ChangeWords words={item.words} /> : null}
      {item.share ? (
        <span className="block text-xs text-ink-soft">
          Your share <span className="nums text-ink">{item.share}</span>
        </span>
      ) : null}
      <span className="font-mono text-[11px] text-ink-faint">{commentTime(item.at)}</span>
    </span>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  if (item.href === null) {
    return (
      <div className="flex w-full items-center px-3 py-3">
        <InboxLine item={item} />
      </div>
    );
  }
  return (
    <form action={openNotification}>
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        className={cx(
          "group flex w-full items-center justify-between gap-3 rounded-sm px-3 py-3 text-left",
          item.read ? null : "bg-pen-soft",
        )}
      >
        <InboxLine item={item} />
        {item.read ? null : <Badge tone="marine">New</Badge>}
      </button>
    </form>
  );
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string | string[] }>;
}) {
  const viewer = await requireUser("/inbox");
  const { after } = await searchParams;
  const [page, unseen] = await Promise.all([listInbox(viewer.id, after), countUnread(viewer.id)]);
  const anyUnread = page.items.some((item) => !item.read);

  return (
    <AccountPage
      title="Inbox"
      actions={
        anyUnread ? (
          <form action={readEverything}>
            <SubmitButton variant="secondary">
              Mark all as read
            </SubmitButton>
          </form>
        ) : null
      }
    >
      <SeenOnLanding act={seeInbox} count={unseen} />
      {page.items.length === 0 ? (
        <EmptyState title={after ? "Nothing older" : "Nothing new"} />
      ) : (
        <Panel>
          {groupByTrip(page.items).map((group) => (
            <section key={group.tripId ?? "none"} className="border-t border-rule first:border-t-0">
              {group.tripName ? <h2 className="px-3 pb-1 pt-3 font-display text-md">{group.tripName}</h2> : null}
              <ul className="flex flex-col divide-y divide-rule">
                {planFirst(group.items).map((item) => (
                  <li key={item.id}>
                    <InboxRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Panel>
      )}
      {page.next ? (
        <div className="flex justify-center">
          <ButtonLink href={`/inbox?after=${encodeURIComponent(page.next)}`}>Older</ButtonLink>
        </div>
      ) : null}
    </AccountPage>
  );
}
