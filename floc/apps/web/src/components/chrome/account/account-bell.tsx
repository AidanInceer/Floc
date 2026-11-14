import { Menu } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { BEAD_COUNT, BEAD_ITEM, BEAD_PANEL, BEAD_TILE } from "@/components/chrome/bead";
import { BellIcon } from "@/components/system/icons";
import { AccountInbox, type InboxPreviewItem } from "@/components/chrome/account/account-inbox";

/** The inbox, beside your name in the one bead that is you. */
export function AccountBell({ unread, latest }: { unread: number; latest: InboxPreviewItem[] }) {
  const shown = unread > 99 ? "99+" : String(unread);
  return (
    <Menu
      label={unread ? `Inbox, ${shown} new` : "Inbox"}
      triggerClassName={cx(BEAD_ITEM, "h-9")}
      anchor="parent"
      panelClassName={cx(BEAD_PANEL, "w-[19rem]")}
      trigger={
        <span className={cx(BEAD_TILE, "relative")}>
          <BellIcon size={15} />
          {unread ? <span aria-hidden className={BEAD_COUNT}>{shown}</span> : null}
        </span>
      }
    >
      <AccountInbox unread={unread} items={latest} />
    </Menu>
  );
}
