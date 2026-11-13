import { Menu } from "@/components/system/client-ui";
import { cx } from "@/components/system/ui";
import { BEAD } from "@/components/chrome/bead";
import { BellIcon } from "@/components/system/icons";
import { AccountInbox, type InboxPreviewItem } from "@/components/chrome/account/account-inbox";

const badgeClass =
  "absolute -right-2 -top-1.5 min-w-4 rounded-full border-2 border-sheet bg-pen px-1 text-center font-mono text-[11px] font-semibold leading-[13px] text-sheet";

/** The inbox, in its own bead beside your name (#637). */
export function AccountBell({ unread, latest }: { unread: number; latest: InboxPreviewItem[] }) {
  const shown = unread > 99 ? "99+" : String(unread);
  return (
    <Menu
      label={unread ? `Inbox, ${shown} new` : "Inbox"}
      triggerClassName={cx(BEAD, "px-3.5 text-ink-soft transition-colors hover:bg-pen-soft hover:text-pen-deep data-[open=true]:bg-pen-soft data-[open=true]:text-pen-deep")}
      panelClassName="right-0 mt-2 w-[19rem] max-w-[calc(100vw-1rem)] rounded-md bg-sheet shadow-[inset_0_0_0_1px_var(--rule),var(--shadow-lift)]"
      trigger={
        <span className="relative inline-flex">
          <BellIcon size={15} />
          {unread ? <span aria-hidden className={badgeClass}>{shown}</span> : null}
        </span>
      }
    >
      <AccountInbox unread={unread} items={latest} />
    </Menu>
  );
}
