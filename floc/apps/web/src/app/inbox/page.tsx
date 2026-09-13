import { commentTime } from "@floc/core/notes/notes";

import { openNotification } from "./actions";
import { requireUser } from "@/server/access";
import { listInbox } from "@/server/notifications/inbox";
import { AccountPage, Panel } from "@/components/auth/account-ui";
import { Badge, ButtonLink, EmptyState, cx } from "@/components/system/ui";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string }>;
}) {
  const viewer = await requireUser("/inbox");
  const { after } = await searchParams;
  const page = await listInbox(viewer.id, after ?? null);

  return (
    <AccountPage eyebrow="What changed" title="Notifications">
      <Panel>
        {page.items.length === 0 ? (
          <EmptyState title={after ? "Nothing older" : "Nothing new"} />
        ) : (
          <ul className="flex flex-col gap-2">
            {page.items.map((item) => (
              <li key={item.id}>
                <form action={openNotification}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className={cx(
                      "lift flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left",
                      item.read ? "border-rule bg-sheet" : "border-pen/30 bg-pen-soft",
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cx("block text-sm", item.read ? "text-ink-2" : "text-ink")}>
                        {item.text}
                      </span>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {commentTime(item.at)}
                      </span>
                    </span>
                    {item.read ? null : <Badge tone="marine">New</Badge>}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {page.next ? (
        <div className="flex justify-center">
          <ButtonLink href={`/inbox?after=${encodeURIComponent(page.next)}`}>Older</ButtonLink>
        </div>
      ) : null}
    </AccountPage>
  );
}
